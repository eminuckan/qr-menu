export type AdisyoOrderType = 1 | 3 | 5 | number

export type AdisyoProductUnit = {
  unitName: string
  productUnitId: number | string
  prices: Array<{
    price: number
    orderType: AdisyoOrderType
  }>
  isDefault: boolean
}

export type AdisyoProduct = {
  productName: string
  productCode: string | null
  productUnits: AdisyoProductUnit[]
  productId: number | string
  taxRate: number
  isStockFollow: boolean
  stockList: Array<{
    stockQuantity: number
    salesChannel: string
  }> | null
  menus: unknown[]
}

export type AdisyoCategory = {
  categoryName: string
  categoryId: number | string
  products: AdisyoProduct[]
}

export type AdisyoProductsResponse = {
  data: AdisyoCategory[]
  status: number
  message: string
}

export type SyncTrigger = "manual" | "scheduled" | "webhook" | "system"

export type AdisyoSyncStats = {
  totalCategories: number
  importedCategories: number
  updatedCategories: number
  archivedCategories: number
  reactivatedCategories: number
  totalProducts: number
  importedProducts: number
  updatedProducts: number
  archivedProducts: number
  reactivatedProducts: number
  importedPrices: number
  updatedPrices: number
  removedPrices: number
  failedItems: {
    categories: Array<{ name: string; error: string }>
    products: Array<{ name: string; category: string; error: string }>
  }
}
