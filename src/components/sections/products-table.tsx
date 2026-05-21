"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Delete02Icon,
  DragDropVerticalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmptyState,
  Toolbar,
} from "@/components/ui/console-primitives";
import { ProductActions } from "./product-actions";
import { createClient } from "@/lib/supabase/client";
import { AllergenLabels, ProductTagLabels } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/lib/services/product-service";
import type { Tables } from "@/lib/types/supabase";

interface ProductsTableProps {
  products: ProductWithRelations[];
  units: Tables<"units">[];
  onStatusChange: (productId: string, newStatus: boolean) => Promise<void>;
  onUpdate: () => Promise<void>;
  onDelete: (productIds: string[]) => Promise<void>;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function ProductsTable({
  products,
  onDelete,
  onStatusChange,
  onUpdate,
  units,
}: ProductsTableProps) {
  const supabase = createClient();
  const [localProducts, setLocalProducts] = useState(products);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const filtered = useMemo(() => {
    return localProducts.filter((product) => {
      if (statusFilter === "active" && !product.is_active) return false;
      if (statusFilter === "inactive" && product.is_active) return false;
      if (search && !normalize(product.name).includes(normalize(search))) return false;
      return true;
    });
  }, [localProducts, search, statusFilter]);

  const allFilteredIds = filtered.map((product) => product.id);
  const allSelectedOnPage =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelectedOnPage = allFilteredIds.some((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allSelectedOnPage) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (productId: string, newStatus: boolean) => {
    setLocalProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, is_active: newStatus } : product,
      ),
    );
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: newStatus })
        .eq("id", productId);
      if (error) throw error;
      onStatusChange?.(productId, newStatus);
    } catch (error) {
      setLocalProducts((current) =>
        current.map((product) =>
          product.id === productId ? { ...product, is_active: !newStatus } : product,
        ),
      );
      console.error("Error updating product status:", error);
      toast.error("Ürün durumu güncellenirken bir hata oluştu");
    }
  };

  const moveRow = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const dragged = localProducts[dragIndex];
      if (!dragged) return;
      const updated = [...localProducts];
      updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      setLocalProducts(updated);
      try {
        const { error } = await supabase.rpc("update_products_order", {
          p_product_ids: updated.map((product) => product.id),
          p_category_id: dragged.category_id ?? "",
        });
        if (error) throw error;
      } catch (error) {
        console.error("Reorder error:", error);
        setLocalProducts(products);
        toast.error(error instanceof Error ? error.message : "Sıralama güncellenirken bir hata oluştu");
      }
    },
    [localProducts, products, supabase],
  );

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    await onDelete(ids);
    setSelected(new Set());
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-6">
        <Toolbar className="mb-0">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <HugeIcon
                icon={Search01Icon}
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Ürün ara"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{filtered.length}</span>
              {filtered.length !== localProducts.length ? `/${localProducts.length}` : ""} ürün
            </span>
          </div>
        </Toolbar>

        {selected.size > 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{selected.size}</span> ürün seçildi
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Temizle
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void handleBulkDelete()}
              >
                <HugeIcon icon={Delete02Icon} size={16} />
                Sil
              </Button>
            </div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            title={localProducts.length === 0 ? "Henüz ürün yok" : "Sonuç bulunamadı"}
            description={
              localProducts.length === 0
                ? "“Ürün ekle” butonunu kullanarak ilk ürünü ekleyin."
                : "Arama veya filtre kriterlerine uygun ürün bulunmuyor."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="hidden grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto_auto] items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:grid">
              <Checkbox
                checked={
                  allSelectedOnPage
                    ? true
                    : someSelectedOnPage
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={toggleAll}
                aria-label="Tümünü seç"
              />
              <span className="w-4" aria-hidden="true" />
              <span className="w-10" aria-hidden="true" />
              <span>Ürün</span>
              <span className="text-right">Fiyat</span>
              <span className="w-10 text-center">Durum</span>
              <span className="w-20 text-right">İşlemler</span>
            </div>

            <ul className="divide-y divide-border">
              {filtered.map((product) => {
                const index = localProducts.findIndex((item) => item.id === product.id);
                return (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                    moveRow={moveRow}
                    selected={selected.has(product.id)}
                    onSelect={toggleOne}
                    onStatusChange={handleStatusChange}
                    onUpdate={onUpdate}
                    units={units}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

interface ProductRowProps {
  product: ProductWithRelations;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  selected: boolean;
  onSelect: (id: string) => void;
  onStatusChange: (productId: string, newStatus: boolean) => Promise<void>;
  onUpdate: () => Promise<void>;
  units: Tables<"units">[];
}

function ProductRow({
  product,
  index,
  moveRow,
  selected,
  onSelect,
  onStatusChange,
  onUpdate,
  units,
}: ProductRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: "PRODUCT_ROW",
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: "PRODUCT_ROW",
    hover: (draggedItem: { index: number }, monitor) => {
      if (!rowRef.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverRect = rowRef.current.getBoundingClientRect();
      const hoverMiddle = (hoverRect.bottom - hoverRect.top) / 2;
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const clientY = offset.y - hoverRect.top;
      if (dragIndex < hoverIndex && clientY < hoverMiddle) return;
      if (dragIndex > hoverIndex && clientY > hoverMiddle) return;
      moveRow(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  drag(handleRef);
  drop(preview(rowRef));

  const coverImage = product.product_images?.find((img) => img.is_cover)?.image_url;
  const prices = product.product_prices ?? [];
  const allergens = product.product_allergens ?? [];
  const tags = product.product_tags ?? [];
  const initials = initialsOf(product.name) || "?";

  return (
    <li
      ref={rowRef}
      style={{ touchAction: "none" }}
      className={cn(
        "group grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto_auto_auto] sm:gap-3 sm:px-4 sm:py-3",
        isDragging && "opacity-40",
        selected && "bg-primary/5",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect(product.id)}
        aria-label={`${product.name} seç`}
      />

      <button
        ref={handleRef}
        type="button"
        className="hidden size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground/50 transition hover:bg-muted hover:text-foreground active:cursor-grabbing sm:flex"
        aria-label="Sırala"
      >
        <HugeIcon icon={DragDropVerticalIcon} size={14} />
      </button>

      <div
        className={cn(
          "relative size-9 shrink-0 overflow-hidden rounded-md sm:size-10",
          !coverImage && "flex items-center justify-center bg-muted",
        )}
        aria-hidden="true"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <span className="text-xs font-semibold uppercase text-muted-foreground/70">
            {initials}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold leading-tight sm:text-[15px]">
            {product.name}
          </span>
        </div>
        {tags.length + allergens.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {tags.map((tag) => (
              <Badge key={`tag-${tag.id}`} variant="secondary" className="text-[10px] font-medium">
                {ProductTagLabels[tag.tag_type as keyof typeof ProductTagLabels]}
              </Badge>
            ))}
            {allergens.map((allergen) => (
              <Badge
                key={`allergen-${allergen.id}`}
                variant="outline"
                className="text-[10px] font-medium"
              >
                {AllergenLabels[allergen.allergen as keyof typeof AllergenLabels]}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
          {prices.length ? (
            <span>
              <span className="font-medium text-foreground">{formatPrice(prices[0].price)}</span>
              <span className="text-muted-foreground"> / {prices[0].unit.name}</span>
              {prices.length > 1 ? <span> · +{prices.length - 1}</span> : null}
            </span>
          ) : (
            <span className="text-muted-foreground">Fiyat yok</span>
          )}
        </div>
      </div>

      <div className="hidden min-w-[120px] text-right tabular-nums sm:block">
        {prices.length === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : prices.length === 1 ? (
          <div>
            <div className="text-sm font-semibold">{formatPrice(prices[0].price)}</div>
            <div className="text-xs text-muted-foreground">/ {prices[0].unit.name}</div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            {prices.map((price) => (
              <div key={price.id} className="text-xs">
                <span className="font-medium text-foreground">{formatPrice(price.price)}</span>
                <span className="text-muted-foreground"> / {price.unit.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Switch
        checked={Boolean(product.is_active)}
        onCheckedChange={(checked) => void onStatusChange(product.id, checked)}
        aria-label={product.is_active ? "Pasifleştir" : "Yayına al"}
      />

      <ProductActions product={product} units={units} onUpdate={onUpdate} />
    </li>
  );
}

export default ProductsTable;
