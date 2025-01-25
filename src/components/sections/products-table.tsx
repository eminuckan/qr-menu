"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { Trash, GripVertical } from "lucide-react";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import type { Product, Unit, ProductWithDetails } from "@/types/database";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useDrag, useDrop } from 'react-dnd'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type ProductFormValues } from "@/lib/validations/product";
import { ProductForm } from "@/components/forms/product-form";
import { ProductService } from "@/lib/services/product-service";
import { useRouter } from "next/router";
import { ProductActions } from "./product-actions";
import { ProductPrice } from "./product-price";
import { ProductStatus } from "./product-status";
import Image from "next/image";

interface ProductsTableProps {
  products: ProductWithDetails[];
  units: Unit[];
  onDelete?: (selectedIds: string[]) => void;
  onAdd?: (product: Partial<Product>) => void;
  onStatusChange?: (productId: string, newStatus: boolean) => void;
  onUpdate: () => void;
}

interface DraggableRowProps {
  index: number
  moveRow: (dragIndex: number, hoverIndex: number) => void
  children: React.ReactNode
}

const DraggableRow = ({ index, moveRow, children }: DraggableRowProps) => {
  const dragDropRef = useRef<HTMLTableRowElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'ROW',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'ROW',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveRow(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(dragDropRef));

  return (
    <tr
      ref={dragDropRef}
      className={`${isDragging ? 'opacity-50 bg-muted' : ''}`}
    >
      {children}
    </tr>
  );
};

const ProductsTable = ({ products: initialProducts, onDelete, onAdd, onStatusChange, onUpdate, units }: ProductsTableProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [localProducts, setLocalProducts] = useState(initialProducts);
  const { toast } = useToast();
  const supabase = createClient();

  // initialProducts değiştiğinde localProducts'ı güncelle
  useEffect(() => {
    setLocalProducts(initialProducts);
  }, [initialProducts]);

  const handleStatusChange = async (productId: string, newStatus: boolean) => {
    try {
      // Önce local state'i güncelle
      setLocalProducts(current =>
        current.map(product =>
          product.id === productId
            ? { ...product, is_active: newStatus }
            : product
        )
      );

      // Sonra API çağrısı yap
      const { error } = await supabase
        .from("products")
        .update({ is_active: newStatus })
        .eq("id", productId);

      if (error) throw error;

      if (onStatusChange) {
        onStatusChange(productId, newStatus);
      }
    } catch (error) {
      // Hata durumunda local state'i geri al
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
      try {
        const draggedProduct = localProducts[dragIndex];
        const updatedProducts = [...localProducts];
        updatedProducts.splice(dragIndex, 1);
        updatedProducts.splice(hoverIndex, 0, draggedProduct);

        // Önce UI'ı güncelle
        setLocalProducts(updatedProducts);

        // Tüm sıralamayı tek seferde güncelle
        const { error } = await supabase.rpc('update_products_order', {
          p_product_ids: updatedProducts.map(p => p.id),
          p_category_id: draggedProduct.category_id
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Sıralama güncellendi",
          description: `"${draggedProduct.name}" ${dragIndex + 1}. sıradan ${hoverIndex + 1}. sıraya taşındı`,
        });
      } catch (error: any) {
        console.error('Error details:', error);
        setLocalProducts(initialProducts);
        toast({
          variant: "destructive",
          title: "Hata",
          description: error?.message || "Sıralama güncellenirken bir hata oluştu",
        });
      }
    },
    [localProducts, initialProducts, supabase, toast]
  );

  const columns: ColumnDef<ProductWithDetails>[] = [
    {
      id: "sort",
      size: 30,
      cell: () => (
        <div className="w-6 cursor-move text-muted-foreground/50">
          <GripVertical className="h-4 w-4" />
        </div>
      ),
    },
    {
      id: "image",
      header: "Fotoğraf",
      cell: ({ row }) => {
        const coverImage = row.original.product_images?.find(img => img.is_cover);
        return (
          <div className="relative w-12 h-12">
            <Image
              src={coverImage?.image_url || "/no-image.jpg"}
              alt={row.original.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Ürün Adı",
    },
    {
      accessorKey: "is_active",
      header: "Durum",
      cell: ({ row }) => <ProductStatus product={row.original} onStatusChange={handleStatusChange} />,
    },
    {
      accessorKey: "price",
      header: () => <div className="text-left">Fiyat</div>,
      cell: ({ row }) => <ProductPrice product={row.original} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ProductActions
          product={row.original}
          units={units}
          onUpdate={onUpdate}
        />
      ),
    },
  ];

  // Seçili ID'leri al
  const getSelectedProductIds = () => {
    return Object.keys(rowSelection)
      .filter(index => rowSelection[index])
      .map(index => initialProducts[parseInt(index)].id);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-full">
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={localProducts}
            searchKey="name"
            onRowSelectionChange={setRowSelection}
            components={{
              row: ({ children, ...props }) => (
                <DraggableRow
                  index={props.row.index}
                  moveRow={moveRow}
                >
                  {children}
                </DraggableRow>
              ),
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
                    onDelete?.(selectedIds);
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