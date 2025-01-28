"use client"

import { Tables } from "@/lib/types/supabase";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, RowSelectionState, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ProductActions } from "./product-actions";
import { Badge } from "@/components/ui/badge";
import { AllergenLabels, ProductTagLabels } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash, GripVertical } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useDrag, useDrop } from 'react-dnd'
import { ProductWithRelations } from "@/lib/services/product-service";
import Image from "next/image";
import { Database } from "@/lib/types/supabase";

interface DraggableHandleProps {
  dragRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

interface ExtendedRow extends Row<ProductWithRelations> {
  dragRef?: React.RefObject<HTMLDivElement | null>;
  isDragging?: boolean;
}

interface DraggableRowProps {
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
  row: ExtendedRow;
}

const DraggableHandle = ({ dragRef, isDragging }: DraggableHandleProps) => {
  return (
    <div
      ref={dragRef}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};

const DraggableRow = ({ index, moveRow, onDragEnd, children, row }: DraggableRowProps) => {
  const dragDropRef = useRef<HTMLTableRowElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ROW',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onDragEnd(item.index, index);
      }
    },
  });

  const [, drop] = useDrop({
    accept: 'ROW',
    hover: (draggedItem: { index: number }, monitor) => {
      if (!dragDropRef.current) {
        return;
      }

      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = dragDropRef.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  // Sadece handle'ı sürüklenebilir yap
  drag(dragHandleRef);
  // Tüm row'u drop target yap
  drop(preview(dragDropRef));

  // row objesine referansları ekle
  row.dragRef = dragHandleRef;
  row.isDragging = isDragging;

  return (
    <tr
      ref={dragDropRef}
      className={`${isDragging ? 'opacity-50 bg-muted' : ''} transition-colors even:bg-muted/50`}
      style={{ touchAction: 'none' }}
    >
      {children}
    </tr>
  );
};

interface ProductsTableProps {
  products: ProductWithRelations[];
  units: Tables<'units'>[];
  onStatusChange: (productId: string, newStatus: boolean) => Promise<void>;
  onUpdate: () => Promise<void>;
  onDelete: (productIds: string[]) => Promise<void>;
}

const ProductsTable = ({ products, onDelete, onStatusChange, onUpdate, units }: ProductsTableProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [localProducts, setLocalProducts] = useState(products);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const handleStatusChange = async (productId: string, newStatus: boolean) => {
    try {
      setLocalProducts(current =>
        current.map(product =>
          product.id === productId
            ? { ...product, is_active: newStatus }
            : product
        )
      );

      const { error } = await supabase
        .from("products")
        .update({ is_active: newStatus })
        .eq("id", productId);

      if (error) throw error;

      if (onStatusChange) {
        onStatusChange(productId, newStatus);
      }
    } catch (error) {
      setLocalProducts(current =>
        current.map(product =>
          product.id === productId
            ? { ...product, is_active: !newStatus }
            : product
        )
      );

      console.error("Error updating product status:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ürün durumu güncellenirken bir hata oluştu",
      });
    }
  };

  const moveRow = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const draggedProduct = localProducts[dragIndex];
      const updatedProducts = [...localProducts];
      updatedProducts.splice(dragIndex, 1);
      updatedProducts.splice(hoverIndex, 0, draggedProduct);

      setLocalProducts(updatedProducts);

      try {
        const { error } = await supabase.rpc('update_products_order', {
          p_product_ids: updatedProducts.map(p => p.id),
          p_category_id: draggedProduct.category_id ?? ""
        });

        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error('Error details:', error);
        setLocalProducts(products);
        toast({
          variant: "destructive",
          title: "Hata",
          description: error?.message || "Sıralama güncellenirken bir hata oluştu",
        });
      }
    },
    [localProducts, products, supabase, toast]
  );

  const handleDragEnd = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedProduct = localProducts[dragIndex];
      toast({
        title: "Sıralama güncellendi",
        description: `"${draggedProduct.name}" ${dragIndex + 1}. sıradan ${hoverIndex + 1}. sıraya taşındı`,
      });
    },
    [localProducts, toast]
  );

  const columns: ColumnDef<ProductWithRelations>[] = [
    {
      id: "reorder",
      size: 40,
      header: () => null,
      cell: ({ row }) => {
        const extendedRow = row as ExtendedRow;
        return <DraggableHandle dragRef={extendedRow.dragRef!} isDragging={extendedRow.isDragging || false} />;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Ürün Adı",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const product = row.original;
        const coverImage = product.product_images?.find(img => img.is_cover)?.image_url;

        return (
          <div className="flex items-center gap-3 py-2">
            <div className="relative w-24 h-24 rounded-md overflow-hidden">
              <Image
                src={(coverImage ?? "/no-image.jpg") as string}
                alt={name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "product_allergens",
      header: "Alerjenler",
      cell: ({ row }) => {
        const allergens = row.original.product_allergens;
        if (!allergens?.length) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {allergens.map((allergen) => (
              <Badge key={allergen.id} variant="outline">
                {AllergenLabels[allergen.allergen as keyof typeof AllergenLabels]}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "product_tags",
      header: "Etiketler",
      cell: ({ row }) => {
        const tags = row.original.product_tags;
        if (!tags?.length) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {ProductTagLabels[tag.tag_type as keyof typeof ProductTagLabels]}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "product_prices",
      header: "Fiyat",
      cell: ({ row }) => {
        const prices = row.original.product_prices;
        if (!prices?.length) return null;
        return (
          <div className="flex flex-col gap-1">
            {prices.map((price) => (
              <div key={price.id} className="flex items-center gap-1">
                <span>{formatPrice(price.price)}</span>
                <span className="text-muted-foreground">
                  / {price.unit.name}
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Durum",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Switch
            checked={isActive}
            onCheckedChange={(checked) =>
              handleStatusChange(row.original.id, checked)
            }
          />
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <ProductActions
            product={row.original}
            units={units}
            onUpdate={onUpdate}
          />
        );
      },
    },
  ];

  const getSelectedProductIds = () => {
    return Object.keys(rowSelection)
      .filter(index => rowSelection[index])
      .map(index => localProducts[parseInt(index)].id);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={localProducts}
            searchKey="name"
            enableRowSelection={false}
            onRowSelectionChange={setRowSelection}
            components={{
              row: ({ children, row }) => (
                <DraggableRow
                  index={row.index}
                  moveRow={moveRow}
                  onDragEnd={handleDragEnd}
                  row={row}
                >
                  {children}
                </DraggableRow>
              ),
            }}
            initialState={{
              pagination: {
                pageSize: 1000 // Çok yüksek bir sayı vererek tüm ürünleri tek sayfada göster
              }
            }}
          />

          {Object.keys(rowSelection).length > 0 && (
            <div className="mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const selectedIds = getSelectedProductIds();
                  if (selectedIds.length > 0) {
                    onDelete(selectedIds);
                    setRowSelection({});
                  }
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                Seçilenleri Sil ({Object.keys(rowSelection).length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DndProvider>
  );
};

export default ProductsTable; 