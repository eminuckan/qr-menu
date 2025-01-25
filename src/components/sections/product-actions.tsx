"use client"
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ProductFormValues } from "@/lib/validations/product";
import { ProductImage, ProductWithDetails, Unit } from "@/types/database";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { ProductForm } from "../forms/product-form";
import { ProductService } from "@/lib/services/product-service";
import { FormProductImage } from "@/components/forms/product-form";

export const ProductActions = ({
  product,
  units,
  onUpdate
}: {
  product: ProductWithDetails;
  units: Unit[];
  onUpdate: () => void;
}) => {
  const { toast } = useToast();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormValues, images?: FormProductImage[]) => {
    setIsSubmitting(true);
    try {
      // 1. Ürün bilgilerini güncelle
      await ProductService.updateProduct(product.id, data);

      if (images?.length) {
        // 2. Silinecek fotoğrafları bul ve sil
        const existingImageIds = images
          .filter(img => img.isExisting)
          .map(img => img.id!);

        const deletedImages = product.product_images
          .filter(img => !existingImageIds.includes(img.id));

        // Storage'dan ve DB'den sil
        for (const img of deletedImages) {
          const fileName = img.image_url.split('/').pop()!;
          await supabase.storage
            .from('product-images')
            .remove([fileName]);

          await supabase
            .from('product_images')
            .delete()
            .eq('id', img.id);
        }

        // 3. Yeni fotoğrafları yükle
        const newImages = images.filter(img => !img.isExisting);
        for (const image of newImages) {
          const fileExt = image.file!.name.split('.').pop();
          const fileName = `${product.id}-${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, image.file!, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(uploadData.path);

          await supabase
            .from('product_images')
            .insert({
              product_id: product.id,
              image_url: publicUrl,
              is_cover: image.is_cover,
              sort_order: 0
            });
        }

        // 4. Cover durumlarını güncelle
        const updatedImages = images.filter(img => img.isExisting);
        for (const image of updatedImages) {
          await supabase
            .from('product_images')
            .update({ is_cover: image.is_cover })
            .eq('id', image.id);
        }
      }

      toast({
        title: "Başarılı",
        description: "Ürün başarıyla güncellendi",
      });
      onUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast({
        title: "Ürün güncellenemedi",
        description: "Ürün güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Düzenle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Ürünü Düzenle</DialogTitle>
        </DialogHeader>
        <ProductForm
          product={product}
          units={units}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isSubmitting={isSubmitting}
          isEdit={true}
        />
      </DialogContent>
    </Dialog>
  );
};