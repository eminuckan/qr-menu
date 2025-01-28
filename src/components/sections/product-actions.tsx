"use client"

import { ProductFormValues } from "@/lib/validations/product";
import { Database } from "@/lib/types/supabase";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { EditProductForm } from "../forms/edit-product-form";
import { ProductService } from "@/lib/services/product-service";
import { FormProductImage } from "@/lib/types/image";
import toast from "react-hot-toast";

type Tables = Database["public"]["Tables"];

interface ProductActionsProps {
  product: Tables["products"]["Row"] & {
    product_images: Tables["product_images"]["Row"][];
    product_allergens: Tables["product_allergens"]["Row"][];
    product_tags: Tables["product_tags"]["Row"][];
    product_prices: (Tables["product_prices"]["Row"] & {
      unit: Tables["units"]["Row"];
    })[];
  };
  units: Tables["units"]["Row"][];
  onUpdate: () => void;
}

export const ProductActions = ({
  product,
  units,
  onUpdate
}: ProductActionsProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormValues, images?: FormProductImage[]) => {
    setIsSubmitting(true);
    try {
      await ProductService.updateProduct(product.id, data);

      if (images?.length) {
        const existingImageIds = images
          .filter(img => img.isExisting)
          .map(img => img.id!);

        const deletedImages = product.product_images
          .filter(img => !existingImageIds.includes(img.id));

        // Silinen resimleri temizle
        for (const img of deletedImages) {
          if (img.image_url) {
            await ProductService.deleteProductImage(img.id, img.image_url);
          }
        }

        // Yeni resimleri yükle
        const newImages = images.filter(img => !img.isExisting);
        for (const image of newImages) {
          if (image.file) {
            await ProductService.uploadProductImage(
              product.id,
              image.file,
              image.is_cover,
              0
            );
          }
        }

        // Mevcut resimleri güncelle
        const updatedImages = images.filter(img => img.isExisting);
        for (const image of updatedImages) {
          if (image.id) {
            await ProductService.updateProductImageCover(image.id, image.is_cover);
          }
        }
      }

      toast.success('Ürün başarıyla güncellendi');

      await new Promise(resolve => setTimeout(resolve, 100));
      setOpen(false);
      onUpdate();

    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Ürün güncellenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting) return;
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Düzenle</Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[900px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Ürünü Düzenle</DialogTitle>
        </DialogHeader>
        <EditProductForm
          product={product}
          units={units}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};