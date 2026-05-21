import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, Json } from "@/lib/types/supabase"
import { AdisyoClient, AdisyoRateLimitError, getEnvAdisyoCredentials, type AdisyoCredentials } from "./client"
import type { AdisyoSupabaseClient } from "./database"
import { decryptAdisyoSecret } from "./secrets"
import type { AdisyoCategory, AdisyoProduct, AdisyoProductUnit, AdisyoSyncStats, SyncTrigger } from "./types"

const PRODUCTS_ENDPOINT = "Products"
const PROVIDER = "adisyo"
const PRODUCTS_RATE_LIMIT_SECONDS = 180
const ADISYO_MENU_EXTERNAL_ID = "products-menu"
const ADISYO_MENU_NAME = "Adisyo Menü"

type MappingRow = {
  id: string
  business_id: string
  entity_type: "menu" | "category" | "product" | "product_price"
  external_id: string
  local_table: string
  local_id: string
  first_seen_run_id: string | null
  first_seen_at: string | null
  is_active: boolean
}

type SyncOptions = {
  businessId: string
  menuId?: string | null
  userId?: string | null
  trigger?: SyncTrigger
  force?: boolean
  skipMembershipCheck?: boolean
}

type ManualVisibilitySnapshot = {
  categoryIds: string[]
  productIds: string[]
}

function createEmptyStats(): AdisyoSyncStats {
  return {
    totalCategories: 0,
    importedCategories: 0,
    updatedCategories: 0,
    archivedCategories: 0,
    reactivatedCategories: 0,
    totalProducts: 0,
    importedProducts: 0,
    updatedProducts: 0,
    archivedProducts: 0,
    reactivatedProducts: 0,
    importedPrices: 0,
    updatedPrices: 0,
    removedPrices: 0,
    failedItems: {
      categories: [],
      products: [],
    },
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function normalizeUnitName(value: string) {
  return normalizeName(value).toLocaleLowerCase("tr-TR")
}

function externalId(value: string | number | null | undefined, fallback: string) {
  return String(value ?? fallback)
}

function secondsUntil(value: string | null | undefined) {
  if (!value) {
    return 0
  }

  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000))
}

function changed<T extends Record<string, unknown>>(current: Record<string, unknown>, next: T) {
  return Object.entries(next).some(([key, value]) => current[key] !== value)
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json
}

function asSyncStats(value: unknown): AdisyoSyncStats {
  const base = createEmptyStats()

  if (!value || typeof value !== "object") {
    return base
  }

  const stats = value as Partial<AdisyoSyncStats>

  return {
    ...base,
    ...stats,
    failedItems: {
      categories: stats.failedItems?.categories ?? [],
      products: stats.failedItems?.products ?? [],
    },
  }
}

export class AdisyoSyncService {
  private readonly db: AdisyoSupabaseClient
  private readonly adminDb: AdisyoSupabaseClient | null
  private readonly adisyo = new AdisyoClient()

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    adminSupabase: SupabaseClient<Database> | null = null,
  ) {
    this.db = supabase as unknown as AdisyoSupabaseClient
    this.adminDb = adminSupabase as unknown as AdisyoSupabaseClient | null
  }

  async syncProducts(options: SyncOptions) {
    if (!options.skipMembershipCheck) {
      await this.assertMembership(options.businessId, options.userId ?? null)
    }
    await this.assertRateLimit(options.businessId, Boolean(options.force))

    const run = await this.createRun(options)
    const runId = run.id as string
    const stats = createEmptyStats()

    try {
      await this.updateState(options.businessId, {
        last_attempt_at: new Date().toISOString(),
        next_allowed_at: new Date(Date.now() + PRODUCTS_RATE_LIMIT_SECONDS * 1000).toISOString(),
        last_status: "running",
        last_error: null,
        last_run_id: runId,
      })

      const credentials = await this.resolveCredentials(options.businessId)
      const categories = await this.adisyo.getProducts(credentials)
      stats.totalCategories = categories.length
      stats.totalProducts = categories.reduce((sum, category) => sum + category.products.length, 0)

      const menuId = await this.ensureMenu(options.businessId, options.menuId ?? null, runId)

      if (this.adminDb) {
        const manualVisibility = await this.captureManualVisibility(options.businessId)

        Object.assign(stats, await this.syncSnapshotWithRpc({
          businessId: options.businessId,
          menuId,
          runId,
          categories,
        }))

        await this.restoreManualVisibility(manualVisibility, stats)

        if (categories.length > 0) {
          const cleanupStats = await this.cleanupUnmappedSnapshotEntitiesWithRpc({
            businessId: options.businessId,
            menuId,
            runId,
          })

          stats.archivedCategories += cleanupStats.archivedCategories
          stats.archivedProducts += cleanupStats.archivedProducts
        }
      } else {
        const seen = {
          categories: new Set<string>(),
          products: new Set<string>(),
          prices: new Set<string>(),
        }

        for (const [categoryIndex, category] of categories.entries()) {
          try {
            const categoryId = await this.upsertCategory({
              businessId: options.businessId,
              menuId,
              runId,
              category,
              sortOrder: categoryIndex + 1,
              stats,
            })

            seen.categories.add(externalId(category.categoryId, category.categoryName))

            for (const [productIndex, product] of category.products.entries()) {
              try {
                const productId = await this.upsertProduct({
                  businessId: options.businessId,
                  categoryId,
                  runId,
                  product,
                  sortOrder: productIndex + 1,
                  stats,
                })

                seen.products.add(externalId(product.productId, product.productName))

                await this.syncPrices({
                  businessId: options.businessId,
                  productId,
                  runId,
                  product,
                  seen,
                  stats,
                })
              } catch (error) {
                stats.failedItems.products.push({
                  name: product.productName,
                  category: category.categoryName,
                  error: error instanceof Error ? error.message : "Bilinmeyen hata",
                })
              }
            }
          } catch (error) {
            stats.failedItems.categories.push({
              name: category.categoryName,
              error: error instanceof Error ? error.message : "Bilinmeyen hata",
            })
          }
        }

        const hasItemFailures = stats.failedItems.categories.length > 0 || stats.failedItems.products.length > 0

        if (!hasItemFailures) {
          await this.archiveStaleEntities(options.businessId, seen, stats)
        }
      }

      await this.db
        .from("adisyo_sync_runs")
        .update({
          menu_id: menuId,
          status: "succeeded",
          finished_at: new Date().toISOString(),
          totals: stats,
        })
        .eq("id", runId)

      await this.updateState(options.businessId, {
        last_success_at: new Date().toISOString(),
        next_allowed_at: new Date(Date.now() + PRODUCTS_RATE_LIMIT_SECONDS * 1000).toISOString(),
        last_status: "succeeded",
        last_error: null,
        last_run_id: runId,
      })

      return {
        success: true,
        runId,
        menuId,
        stats,
      }
    } catch (error) {
      const retryAfterSeconds = error instanceof AdisyoRateLimitError
        ? error.retryAfterSeconds
        : PRODUCTS_RATE_LIMIT_SECONDS

      await this.db
        .from("adisyo_sync_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          totals: stats,
          error: error instanceof Error ? error.message : "Unknown sync error",
        })
        .eq("id", runId)

      await this.updateState(options.businessId, {
        next_allowed_at: new Date(Date.now() + retryAfterSeconds * 1000).toISOString(),
        last_status: "failed",
        last_error: error instanceof Error ? error.message : "Unknown sync error",
        last_run_id: runId,
      })

      throw error
    }
  }

  private async assertMembership(businessId: string, userId: string | null) {
    if (!userId) {
      throw new Error("Oturum bulunamadı.")
    }

    const { data, error } = await this.supabase
      .from("business_users")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error("Bu işletme için Adisyo senkronizasyon yetkiniz yok.")
    }
  }

  private async assertRateLimit(businessId: string, force: boolean) {
    if (force) {
      return
    }

    const { data, error } = await this.db
      .from("adisyo_sync_state")
      .select("next_allowed_at")
      .eq("business_id", businessId)
      .eq("provider", PROVIDER)
      .eq("endpoint", PRODUCTS_ENDPOINT)
      .maybeSingle()

    if (error) {
      throw error
    }

    const remainingSeconds = secondsUntil(data?.next_allowed_at)
    if (remainingSeconds > 0) {
      throw new AdisyoRateLimitError(remainingSeconds)
    }
  }

  private async createRun(options: SyncOptions) {
    const { data, error } = await this.db
      .from("adisyo_sync_runs")
      .insert({
        business_id: options.businessId,
        menu_id: options.menuId ?? null,
        status: "running",
        trigger: options.trigger ?? "manual",
        created_by: options.userId ?? null,
      })
      .select("id")
      .single()

    if (error) {
      throw error
    }

    return data
  }

  private async resolveCredentials(businessId: string): Promise<AdisyoCredentials> {
    if (this.adminDb) {
      const { data, error } = await this.adminDb
        .from("adisyo_connections")
        .select("api_key,api_secret,api_consumer")
        .eq("business_id", businessId)
        .eq("provider", PROVIDER)
        .eq("is_active", true)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data?.api_key && data.api_secret && data.api_consumer) {
        return {
          apiKey: decryptAdisyoSecret(data.api_key),
          apiSecret: decryptAdisyoSecret(data.api_secret),
          apiConsumer: decryptAdisyoSecret(data.api_consumer),
        }
      }
    }

    return getEnvAdisyoCredentials()
  }

  private async syncSnapshotWithRpc(args: {
    businessId: string
    menuId: string
    runId: string
    categories: AdisyoCategory[]
  }) {
    if (!this.adminDb) {
      return createEmptyStats()
    }

    const { data, error } = await this.adminDb.rpc("sync_adisyo_products_snapshot", {
      p_business_id: args.businessId,
      p_menu_id: args.menuId,
      p_run_id: args.runId,
      p_payload: toJson(args.categories),
    })

    if (error) {
      throw error
    }

    return asSyncStats(data)
  }

  private async captureManualVisibility(businessId: string): Promise<ManualVisibilitySnapshot> {
    if (!this.adminDb) {
      return { categoryIds: [], productIds: [] }
    }

    const { data: mappings, error: mappingsError } = await this.adminDb
      .from("adisyo_sync_mappings")
      .select("entity_type,local_id")
      .eq("business_id", businessId)
      .eq("provider", PROVIDER)
      .eq("is_active", true)
      .in("entity_type", ["category", "product"])

    if (mappingsError) {
      throw mappingsError
    }

    const categoryIds = (mappings ?? [])
      .filter((mapping) => mapping.entity_type === "category")
      .map((mapping) => mapping.local_id)
    const productIds = (mappings ?? [])
      .filter((mapping) => mapping.entity_type === "product")
      .map((mapping) => mapping.local_id)

    const [hiddenCategories, hiddenProducts] = await Promise.all([
      this.findInactiveCategories(categoryIds),
      this.findInactiveProducts(productIds),
    ])

    return {
      categoryIds: hiddenCategories,
      productIds: hiddenProducts,
    }
  }

  private async findInactiveCategories(categoryIds: string[]) {
    if (!this.adminDb || categoryIds.length === 0) {
      return []
    }

    const { data, error } = await this.adminDb
      .from("categories")
      .select("id")
      .in("id", categoryIds)
      .eq("is_active", false)

    if (error) {
      throw error
    }

    return (data ?? []).map((category) => category.id)
  }

  private async findInactiveProducts(productIds: string[]) {
    if (!this.adminDb || productIds.length === 0) {
      return []
    }

    const { data, error } = await this.adminDb
      .from("products")
      .select("id")
      .in("id", productIds)
      .eq("is_active", false)

    if (error) {
      throw error
    }

    return (data ?? []).map((product) => product.id)
  }

  private async restoreManualVisibility(snapshot: ManualVisibilitySnapshot, stats: AdisyoSyncStats) {
    if (!this.adminDb) {
      return
    }

    const [restoredCategories, restoredProducts] = await Promise.all([
      this.setCategoriesInactive(snapshot.categoryIds),
      this.setProductsInactive(snapshot.productIds),
    ])

    stats.reactivatedCategories = Math.max(0, stats.reactivatedCategories - restoredCategories)
    stats.reactivatedProducts = Math.max(0, stats.reactivatedProducts - restoredProducts)
  }

  private async setCategoriesInactive(categoryIds: string[]) {
    if (!this.adminDb || categoryIds.length === 0) {
      return 0
    }

    const { error } = await this.adminDb
      .from("categories")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", categoryIds)

    if (error) {
      throw error
    }

    return categoryIds.length
  }

  private async setProductsInactive(productIds: string[]) {
    if (!this.adminDb || productIds.length === 0) {
      return 0
    }

    const { error } = await this.adminDb
      .from("products")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", productIds)

    if (error) {
      throw error
    }

    return productIds.length
  }

  private async cleanupUnmappedSnapshotEntitiesWithRpc(args: {
    businessId: string
    menuId: string
    runId: string
  }) {
    if (!this.adminDb) {
      return { archivedCategories: 0, archivedProducts: 0 }
    }

    const { data, error } = await this.adminDb.rpc("cleanup_adisyo_unmapped_snapshot_entities", {
      p_business_id: args.businessId,
      p_menu_id: args.menuId,
      p_run_id: args.runId,
    })

    if (error) {
      throw error
    }

    const stats = asSyncStats(data)

    return {
      archivedCategories: stats.archivedCategories,
      archivedProducts: stats.archivedProducts,
    }
  }

  private async updateState(businessId: string, values: Record<string, unknown>) {
    const { error } = await this.db
      .from("adisyo_sync_state")
      .upsert({
        business_id: businessId,
        provider: PROVIDER,
        endpoint: PRODUCTS_ENDPOINT,
        updated_at: new Date().toISOString(),
        ...values,
      }, {
        onConflict: "business_id,provider,endpoint",
      })

    if (error) {
      throw error
    }
  }

  private async ensureMenu(businessId: string, requestedMenuId: string | null, runId: string) {
    if (requestedMenuId) {
      const { data, error } = await this.supabase
        .from("menus")
        .select("id")
        .eq("id", requestedMenuId)
        .eq("business_id", businessId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        await this.upsertMapping({
          businessId,
          entityType: "menu",
          externalId: ADISYO_MENU_EXTERNAL_ID,
          localTable: "menus",
          localId: data.id,
          runId,
          sourcePayload: { name: ADISYO_MENU_NAME },
        })

        return data.id
      }
    }

    const mappedMenu = await this.getMapping(businessId, "menu", ADISYO_MENU_EXTERNAL_ID)
    if (mappedMenu) {
      const { data } = await this.supabase
        .from("menus")
        .select("id")
        .eq("id", mappedMenu.local_id)
        .eq("business_id", businessId)
        .maybeSingle()

      if (data) {
        return data.id
      }
    }

    const { data: existingMenu, error: existingError } = await this.supabase
      .from("menus")
      .select("id")
      .eq("business_id", businessId)
      .ilike("name", ADISYO_MENU_NAME)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingMenu) {
      await this.upsertMapping({
        businessId,
        entityType: "menu",
        externalId: ADISYO_MENU_EXTERNAL_ID,
        localTable: "menus",
        localId: existingMenu.id,
        runId,
        sourcePayload: { name: ADISYO_MENU_NAME },
      })

      return existingMenu.id
    }

    const { data: createdMenu, error: createError } = await this.supabase
      .from("menus")
      .insert({
        business_id: businessId,
        name: ADISYO_MENU_NAME,
        is_active: true,
        color: "#ffffff",
      })
      .select("id")
      .single()

    if (createError) {
      throw createError
    }

    await this.upsertMapping({
      businessId,
      entityType: "menu",
      externalId: ADISYO_MENU_EXTERNAL_ID,
      localTable: "menus",
      localId: createdMenu.id,
      runId,
      sourcePayload: { name: ADISYO_MENU_NAME },
    })

    return createdMenu.id
  }

  private async upsertCategory(args: {
    businessId: string
    menuId: string
    runId: string
    category: AdisyoCategory
    sortOrder: number
    stats: AdisyoSyncStats
  }) {
    const categoryName = normalizeName(args.category.categoryName)
    const id = externalId(args.category.categoryId, categoryName)
    const mapping = await this.getMapping(args.businessId, "category", id)
    const syncValues = {
      menu_id: args.menuId,
      name: categoryName,
      is_active: true,
      color: "#ffffff",
    }

    if (mapping) {
      const { data: current, error } = await this.supabase
        .from("categories")
        .select("id,menu_id,name,is_active,sort_order,color")
        .eq("id", mapping.local_id)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (current) {
        if (changed(current, syncValues)) {
          const { error: updateError } = await this.supabase
            .from("categories")
            .update(syncValues)
            .eq("id", current.id)

          if (updateError) {
            throw updateError
          }

          args.stats.updatedCategories++
          if (!current.is_active) {
            args.stats.reactivatedCategories++
          }
        }

        await this.upsertMapping({
          businessId: args.businessId,
          entityType: "category",
          externalId: id,
          localTable: "categories",
          localId: current.id,
          runId: args.runId,
          sourcePayload: args.category,
        })

        return current.id
      }
    }

    const { data: adopted } = await this.supabase
      .from("categories")
      .select("id")
      .eq("menu_id", args.menuId)
      .eq("name", categoryName)
      .maybeSingle()

    if (adopted) {
      await this.supabase.from("categories").update(syncValues).eq("id", adopted.id)
      await this.upsertMapping({
        businessId: args.businessId,
        entityType: "category",
        externalId: id,
        localTable: "categories",
        localId: adopted.id,
        runId: args.runId,
        sourcePayload: args.category,
      })
      args.stats.updatedCategories++
      return adopted.id
    }

    const nextValues = {
      ...syncValues,
      sort_order: await this.getNextCategorySortOrder(args.menuId),
    }

    const { data: created, error: createError } = await this.supabase
      .from("categories")
      .insert(nextValues)
      .select("id")
      .single()

    if (createError) {
      throw createError
    }

    await this.upsertMapping({
      businessId: args.businessId,
      entityType: "category",
      externalId: id,
      localTable: "categories",
      localId: created.id,
      runId: args.runId,
      sourcePayload: args.category,
    })
    args.stats.importedCategories++

    return created.id
  }

  private async getNextCategorySortOrder(menuId: string) {
    const { data, error } = await this.supabase
      .from("categories")
      .select("sort_order")
      .eq("menu_id", menuId)

    if (error) {
      throw error
    }

    const maxSortOrder = (data ?? []).reduce((max, category) => {
      return Math.max(max, category.sort_order ?? 0)
    }, 0)

    return maxSortOrder + 1
  }

  private async upsertProduct(args: {
    businessId: string
    categoryId: string
    runId: string
    product: AdisyoProduct
    sortOrder: number
    stats: AdisyoSyncStats
  }) {
    const productName = normalizeName(args.product.productName)
    const id = externalId(args.product.productId, productName)
    const mapping = await this.getMapping(args.businessId, "product", id)
    const nextValues = {
      category_id: args.categoryId,
      name: productName,
      kdv_rate: args.product.taxRate,
      is_active: true,
      sort_order: args.sortOrder,
    }

    if (mapping) {
      const { data: current, error } = await this.supabase
        .from("products")
        .select("id,category_id,name,kdv_rate,is_active,sort_order")
        .eq("id", mapping.local_id)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (current) {
        if (changed(current, nextValues)) {
          const { error: updateError } = await this.supabase
            .from("products")
            .update(nextValues)
            .eq("id", current.id)

          if (updateError) {
            throw updateError
          }

          args.stats.updatedProducts++
          if (!current.is_active) {
            args.stats.reactivatedProducts++
          }
        }

        await this.upsertMapping({
          businessId: args.businessId,
          entityType: "product",
          externalId: id,
          localTable: "products",
          localId: current.id,
          runId: args.runId,
          sourcePayload: args.product,
        })

        return current.id
      }
    }

    const { data: adopted } = await this.supabase
      .from("products")
      .select("id")
      .eq("category_id", args.categoryId)
      .eq("name", productName)
      .maybeSingle()

    if (adopted) {
      await this.supabase.from("products").update(nextValues).eq("id", adopted.id)
      await this.upsertMapping({
        businessId: args.businessId,
        entityType: "product",
        externalId: id,
        localTable: "products",
        localId: adopted.id,
        runId: args.runId,
        sourcePayload: args.product,
      })
      args.stats.updatedProducts++
      return adopted.id
    }

    const { data: created, error: createError } = await this.supabase
      .from("products")
      .insert(nextValues)
      .select("id")
      .single()

    if (createError) {
      throw createError
    }

    await this.upsertMapping({
      businessId: args.businessId,
      entityType: "product",
      externalId: id,
      localTable: "products",
      localId: created.id,
      runId: args.runId,
      sourcePayload: args.product,
    })
    args.stats.importedProducts++

    return created.id
  }

  private async syncPrices(args: {
    businessId: string
    productId: string
    runId: string
    product: AdisyoProduct
    seen: { prices: Set<string> }
    stats: AdisyoSyncStats
  }) {
    for (const unit of args.product.productUnits) {
      const displayPrice = unit.prices.find((price) => price.orderType === 1) ?? unit.prices[0]

      if (!displayPrice) {
        continue
      }

      const unitId = await this.findOrCreateUnit(unit)
      const priceExternalId = `${externalId(args.product.productId, args.product.productName)}:${externalId(unit.productUnitId, unit.unitName)}:${displayPrice.orderType}`
      args.seen.prices.add(priceExternalId)

      const mapping = await this.getMapping(args.businessId, "product_price", priceExternalId)
      const nextValues = {
        product_id: args.productId,
        unit_id: unitId,
        price: displayPrice.price,
      }

      if (mapping) {
        const { data: current, error } = await this.supabase
          .from("product_prices")
          .select("id,product_id,unit_id,price")
          .eq("id", mapping.local_id)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (current) {
          if (changed(current, nextValues)) {
            const { error: updateError } = await this.supabase
              .from("product_prices")
              .update(nextValues)
              .eq("id", current.id)

            if (updateError) {
              throw updateError
            }

            args.stats.updatedPrices++
          }

          await this.upsertMapping({
            businessId: args.businessId,
            entityType: "product_price",
            externalId: priceExternalId,
            localTable: "product_prices",
            localId: current.id,
            runId: args.runId,
            sourcePayload: unit,
          })
          continue
        }
      }

      const { data: adopted } = await this.supabase
        .from("product_prices")
        .select("id,price")
        .eq("product_id", args.productId)
        .eq("unit_id", unitId)
        .maybeSingle()

      if (adopted) {
        if (adopted.price !== displayPrice.price) {
          await this.supabase
            .from("product_prices")
            .update({ price: displayPrice.price })
            .eq("id", adopted.id)
          args.stats.updatedPrices++
        }

        await this.upsertMapping({
          businessId: args.businessId,
          entityType: "product_price",
          externalId: priceExternalId,
          localTable: "product_prices",
          localId: adopted.id,
          runId: args.runId,
          sourcePayload: unit,
        })
        continue
      }

      const { data: created, error: createError } = await this.supabase
        .from("product_prices")
        .insert(nextValues)
        .select("id")
        .single()

      if (createError) {
        throw createError
      }

      await this.upsertMapping({
        businessId: args.businessId,
        entityType: "product_price",
        externalId: priceExternalId,
        localTable: "product_prices",
        localId: created.id,
        runId: args.runId,
        sourcePayload: unit,
      })
      args.stats.importedPrices++
    }
  }

  private async findOrCreateUnit(unit: AdisyoProductUnit) {
    const normalizedName = normalizeUnitName(unit.unitName)

    const { data: existing, error: searchError } = await this.supabase
      .from("units")
      .select("id")
      .eq("normalized_name", normalizedName)
      .maybeSingle()

    if (searchError) {
      throw searchError
    }

    if (existing) {
      return existing.id
    }

    const { data: created, error: createError } = await this.supabase
      .from("units")
      .insert({
        name: normalizeName(unit.unitName),
        normalized_name: normalizedName,
      })
      .select("id")
      .single()

    if (createError) {
      throw createError
    }

    return created.id
  }

  private async archiveStaleEntities(
    businessId: string,
    seen: {
      categories: Set<string>
      products: Set<string>
      prices: Set<string>
    },
    stats: AdisyoSyncStats,
  ) {
    await this.archiveMappings({
      businessId,
      entityType: "product_price",
      seenExternalIds: seen.prices,
      onArchive: async (mapping) => {
        const { error } = await this.supabase
          .from("product_prices")
          .delete()
          .eq("id", mapping.local_id)

        if (error) {
          throw error
        }

        stats.removedPrices++
      },
    })

    await this.archiveMappings({
      businessId,
      entityType: "product",
      seenExternalIds: seen.products,
      onArchive: async (mapping) => {
        const { error } = await this.supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", mapping.local_id)

        if (error) {
          throw error
        }

        stats.archivedProducts++
      },
    })

    await this.archiveMappings({
      businessId,
      entityType: "category",
      seenExternalIds: seen.categories,
      onArchive: async (mapping) => {
        const { error } = await this.supabase
          .from("categories")
          .update({ is_active: false })
          .eq("id", mapping.local_id)

        if (error) {
          throw error
        }

        stats.archivedCategories++
      },
    })
  }

  private async archiveMappings(args: {
    businessId: string
    entityType: "category" | "product" | "product_price"
    seenExternalIds: Set<string>
    onArchive: (mapping: MappingRow) => Promise<void>
  }) {
    const { data, error } = await this.db
      .from("adisyo_sync_mappings")
      .select("id,business_id,entity_type,external_id,local_table,local_id,first_seen_run_id,first_seen_at,is_active")
      .eq("business_id", args.businessId)
      .eq("provider", PROVIDER)
      .eq("entity_type", args.entityType)
      .eq("is_active", true)

    if (error) {
      throw error
    }

    for (const mapping of (data ?? []) as MappingRow[]) {
      if (args.seenExternalIds.has(mapping.external_id)) {
        continue
      }

      await args.onArchive(mapping)

      const { error: updateError } = await this.db
        .from("adisyo_sync_mappings")
        .update({
          is_active: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", mapping.id)

      if (updateError) {
        throw updateError
      }
    }
  }

  private async getMapping(
    businessId: string,
    entityType: MappingRow["entity_type"],
    id: string,
  ): Promise<MappingRow | null> {
    const { data, error } = await this.db
      .from("adisyo_sync_mappings")
      .select("id,business_id,entity_type,external_id,local_table,local_id,first_seen_run_id,first_seen_at,is_active")
      .eq("business_id", businessId)
      .eq("provider", PROVIDER)
      .eq("entity_type", entityType)
      .eq("external_id", id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data as MappingRow | null
  }

  private async upsertMapping(args: {
    businessId: string
    entityType: MappingRow["entity_type"]
    externalId: string
    localTable: string
    localId: string
    runId: string
    sourcePayload: unknown
  }) {
    const existing = await this.getMapping(args.businessId, args.entityType, args.externalId)
    const now = new Date().toISOString()

    const { error } = await this.db
      .from("adisyo_sync_mappings")
      .upsert({
        business_id: args.businessId,
        provider: PROVIDER,
        entity_type: args.entityType,
        external_id: args.externalId,
        local_table: args.localTable,
        local_id: args.localId,
        first_seen_run_id: existing?.first_seen_run_id ?? args.runId,
        last_seen_run_id: args.runId,
        first_seen_at: existing?.first_seen_at ?? now,
        last_seen_at: now,
        is_active: true,
        source_payload: toJson(args.sourcePayload),
      }, {
        onConflict: "business_id,provider,entity_type,external_id",
      })

    if (error) {
      throw error
    }
  }
}
