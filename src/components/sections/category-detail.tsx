"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddCircleIcon,
  AlertCircleIcon,
  Delete02Icon,
  ImageUpload01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  PageHeader,
  SummaryTile,
  EmptyState,
  StatusBadge,
} from "@/components/ui/console-primitives";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductsTable from "@/components/sections/products-table";
import { AddProductForm } from "../forms/add-product-form";
import { createClient } from "@/lib/supabase/client";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";
import { ProductService, type ProductWithRelations } from "@/lib/services/product-service";
import { CategoryService, type CategoryWithProducts } from "@/lib/services/category-service";
import type { Tables, Database } from "@/lib/types/supabase";
import type { FormProductImage } from "@/lib/types/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const CategoryDetail = ({ id }: { id: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [units, setUnits] = useState<Tables<"units">[]>([]);
  const [sortedProducts, setSortedProducts] = useState<ProductWithRelations[]>([]);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "",
      calories: 0,
      preparing_time: 0,
      allergens: [],
      tags: [],
      prices: [{ unit_id: "", price: 0 }],
      is_active: true,
      sort_order: 0,
      category_id: id,
    },
  });

  const fetchCategory = async () => {
    setIsLoading(true);
    try {
      const categoryData = await CategoryService.getCategory(id);
      setCategory(categoryData);
      const sorted = [...(categoryData.products || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
      setSortedProducts(sorted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kategori bilgileri yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUnits = async () => {
      const { data, error } = await supabase.from("units").select("*").order("name");
      if (error) {
        toast.error("Birimler yüklenirken bir hata oluştu");
        return;
      }
      setUnits(data || []);
    };
    void fetchUnits();
  }, [supabase]);

  useEffect(() => {
    if (id) {
      void fetchCategory();
    }
  }, [id]);

  const handleImageDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await CategoryService.uploadCategoryImage(file, id);
      setCategory((prev) => (prev ? { ...prev, cover_image: publicUrl } : null));
      toast.success("Fotoğraf başarıyla güncellendi");
      setImageDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotoğraf yüklenirken bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNameChange = async (newName: string) => {
    try {
      await CategoryService.updateCategoryName(id, newName);
      setCategory((prev) => (prev ? { ...prev, name: newName } : null));
      toast.success("Kategori adı güncellendi");
    } catch (error) {
      toast.error("Kategori adı güncellenirken bir hata oluştu");
    }
  };

  const handleProductSubmit = async (data: ProductFormValues, images?: FormProductImage[]) => {
    setIsSubmitting(true);
    try {
      const maxSortOrder = sortedProducts.reduce(
        (max, product) => Math.max(max, product.sort_order ?? 0),
        0,
      );

      const result = await ProductService.createProduct({
        name: data.name,
        description: data.description,
        color: data.color,
        calories: data.calories,
        preparing_time: data.preparing_time,
        category_id: id,
        is_active: true,
        sort_order: maxSortOrder + 1,
        allergens: data.allergens as Database["public"]["Enums"]["allergen_type"][],
        tags: data.tags as Database["public"]["Enums"]["product_tag_type"][],
        prices: data.prices.map((price) => ({
          unit_id: price.unit_id,
          price: price.price,
        })),
      });

      if (images && images.length > 0) {
        for (const image of images) {
          if (image.file) {
            await ProductService.uploadProductImage(result.id, image.file, image.is_cover);
          }
        }
      }

      toast.success("Ürün başarıyla eklendi");
      setAddProductDialogOpen(false);
      await fetchCategory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ürün eklenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductsDelete = async (productIds: string[]) => {
    try {
      if (!productIds.length) return;
      await ProductService.deleteProducts(productIds);
      toast.success("Seçili ürünler başarıyla silindi");
      await fetchCategory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ürünler silinirken bir hata oluştu");
    }
  };

  const handleProductStatusChange = async (productId: string, newStatus: boolean) => {
    try {
      await ProductService.updateProductStatus(productId, newStatus);
      setCategory((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          products: prev.products.map((product) =>
            product.id === productId ? { ...product, is_active: newStatus } : product,
          ),
        };
      });
      toast.success("Ürün durumu güncellendi");
    } catch (error) {
      toast.error("Ürün durumu güncellenirken bir hata oluştu");
    }
  };

  const handleDelete = async () => {
    try {
      const menuId = category?.menu_id;
      await CategoryService.deleteCategory(id);
      toast.success("Kategori ve ilişkili tüm veriler silindi");
      router.push(`/dashboard/menu/${menuId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kategori silinirken bir hata oluştu");
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (!category) {
    return (
      <EmptyState
        title="Kategori bulunamadı"
        description="Bu kategori silinmiş veya erişim yetkiniz değişmiş olabilir."
      />
    );
  }

  const activeProducts = sortedProducts.filter((product) => product.is_active).length;
  const totalProducts = sortedProducts.length;
  const inactiveProducts = totalProducts - activeProducts;

  return (
    <div>
      <PageHeader
        title={category.name}
        backHref={`/dashboard/menu/${category.menu_id}`}
        editable
        onTitleChange={handleNameChange}
        description="Kategoriye bağlı ürünleri yönetin, sıralayın ve fotoğrafı güncelleyin."
        meta={
          <>
            <StatusBadge tone={category.is_active ? "success" : "neutral"}>
              {category.is_active ? "Aktif" : "Pasif"}
            </StatusBadge>
            <span>{totalProducts} ürün</span>
          </>
        }
        actions={
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HugeIcon icon={Delete02Icon} size={16} />
                  Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kategoriyi sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu işlem geri alınamaz. Kategoriyle birlikte tüm ürünler, fiyatlar, görseller,
                    alerjen ve etiket kayıtları silinecek.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" size="sm" disabled>
              <HugeIcon icon={SparklesIcon} size={16} />
              Kampanyalı ürün
            </Button>

            <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <HugeIcon icon={AddCircleIcon} size={16} />
                  Ürün ekle
                </Button>
              </DialogTrigger>
              <DialogContent
                className="w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]"
                onClick={(event) => event.stopPropagation()}
              >
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">Ürün ekle</DialogTitle>
                </DialogHeader>
                <AddProductForm
                  onSubmit={handleProductSubmit}
                  units={units}
                  onCancel={() => setAddProductDialogOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,260px)_repeat(3,minmax(0,1fr))]">
        <div className="relative h-36 overflow-hidden rounded-lg border border-border bg-muted sm:row-span-1 lg:h-full">
          <Image
            src={category.cover_image || "/no-image.jpg"}
            alt={category.name}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 260px, 100vw"
          />
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
              >
                <HugeIcon icon={ImageUpload01Icon} size={18} />
                Görseli güncelle
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Kategori fotoğrafını güncelle</DialogTitle>
              </DialogHeader>
              <Alert className="mb-3">
                <HugeIcon icon={AlertCircleIcon} size={16} />
                <AlertDescription>
                  En fazla 5 MB, minimum 350×350 piksel boyutunda bir görsel seçin.
                </AlertDescription>
              </Alert>
              <FileDropzone
                onDrop={handleImageDrop}
                isUploading={isUploading}
                maxSize={MAX_FILE_SIZE}
              />
            </DialogContent>
          </Dialog>
        </div>
        <SummaryTile label="Toplam ürün" value={totalProducts} detail="Tüm kayıtlar" />
        <SummaryTile
          label="Yayında"
          value={activeProducts}
          detail={`${totalProducts ? Math.round((activeProducts / totalProducts) * 100) : 0}% yayın oranı`}
          tone={activeProducts ? "success" : "warning"}
        />
        <SummaryTile
          label="Gizli"
          value={inactiveProducts}
          detail={inactiveProducts ? "Müşteriye görünmüyor" : "Tüm ürünler yayında"}
          tone={inactiveProducts ? "warning" : "neutral"}
        />
      </section>

      {sortedProducts.length === 0 ? (
        <EmptyState
          title="Henüz ürün yok"
          description="“Ürün ekle” butonunu kullanarak bu kategoriye ilk ürünü ekleyin."
        />
      ) : (
        <ProductsTable
          products={sortedProducts}
          onStatusChange={handleProductStatusChange}
          units={units}
          onUpdate={fetchCategory}
          onDelete={handleProductsDelete}
        />
      )}
    </div>
  );
};

export default CategoryDetail;
