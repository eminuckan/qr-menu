"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, X, PlusCircle, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/layout/page-header";
import ProductsTable from "@/components/sections/products-table";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";
import { ProductService } from "@/lib/services/product-service";
import { AddProductForm } from "../forms/add-product-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { CategoryService, CategoryWithProducts } from "@/lib/services/category-service";
import { Tables, Database } from '@/lib/types/supabase';
import { FormProductImage } from "@/lib/types/image";
import { ProductWithRelations } from "@/lib/services/product-service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CategoryDetail = ({ id }: { id: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [units, setUnits] = useState<Tables<"units">[]>([]);
  const [sortedProducts, setSortedProducts] = useState<ProductWithRelations[]>([]);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);

  const { toast } = useToast();
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
      prices: [{
        unit_id: "",
        price: 0
      }],
      is_active: true,
      sort_order: 0,
      category_id: id
    },
  });

  const fetchCategory = async () => {
    setIsLoading(true);
    try {
      const categoryData = await CategoryService.getCategory(id);
      setCategory(categoryData);
      const sortedProductsData = [...(categoryData.products || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setSortedProducts(sortedProductsData);
    } catch (error) {
      console.error('Kategori yükleme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Kategori bilgileri yüklenemedi",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUnits = async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name");

      if (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Birimler yüklenirken bir hata oluştu",
        });
        return;
      }

      setUnits(data || []);
    };

    fetchUnits();
  }, [supabase, toast]);

  const handleImageDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await CategoryService.uploadCategoryImage(file, id);
      setCategory((prev) => prev ? { ...prev, cover_image: publicUrl } : null);

      toast({
        title: "Başarılı",
        description: "Fotoğraf başarıyla güncellendi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Fotoğraf yüklenirken bir hata oluştu",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCategory();
      } catch (error) {
        console.error("Kategori yükleme hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kategori bilgileri yüklenemedi",
        });
      }
    };

    if (id) {
      loadData();
    }
  }, [id, supabase, toast]);

  const handleNameChange = async (newName: string) => {
    try {
      await CategoryService.updateCategoryName(id, newName);

      setCategory((prev) => (prev ? { ...prev, name: newName } : null));

      toast({
        title: "Başarılı",
        description: "Kategori adı güncellendi",
      });
    } catch (error) {
      console.error("Error updating category name:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori adı güncellenirken bir hata oluştu",
      });
    }
  };

  const handleProductSubmit = async (data: ProductFormValues, images?: FormProductImage[]) => {
    setIsSubmitting(true);
    try {
      const maxSortOrder = sortedProducts.reduce((max, product) => Math.max(max, product.sort_order ?? 0), 0);

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
        prices: data.prices.map(price => ({
          unit_id: price.unit_id,
          price: price.price
        }))
      });

      if (images && images.length > 0) {
        for (const image of images) {
          if (image.file) {
            await ProductService.uploadProductImage(
              result.id,
              image.file,
              image.is_cover
            );
          }
        }
      }

      toast({
        title: "Başarılı",
        description: "Ürün başarıyla eklendi",
      });

      setAddProductDialogOpen(false);
      await fetchCategory();
    } catch (error) {
      console.error("Product submit error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürün eklenirken bir hata oluştu",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddProductDialogChange = (newOpen: boolean) => {
    setAddProductDialogOpen(newOpen);
  };

  const handleProductsDelete = async (productIds: string[]) => {
    try {
      if (!productIds.length) return;

      await ProductService.deleteProducts(productIds);

      toast({
        title: "Başarılı",
        description: "Seçili ürünler başarıyla silindi",
      });

      await fetchCategory();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürünler silinirken bir hata oluştu",
      });
    }
  };

  const handleProductStatusChange = async (productId: string, newStatus: boolean) => {
    try {
      await ProductService.updateProductStatus(productId, newStatus);

      setCategory(prev => {
        if (!prev) return null;
        return {
          ...prev,
          products: prev.products.map(product =>
            product.id === productId
              ? { ...product, is_active: newStatus }
              : product
          )
        };
      });

      toast({
        title: "Başarılı",
        description: "Ürün durumu güncellendi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ürün durumu güncellenirken bir hata oluştu",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const menuId = category?.menu_id;
      await CategoryService.deleteCategory(id);

      toast({
        title: "Başarılı",
        description: "Kategori ve ilişkili tüm veriler başarıyla silindi",
      });

      router.push(`/dashboard/menu/${menuId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Kategori silinirken bir hata oluştu",
      });
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <PageHeader
          title={category.name}
          isEditable
          onTitleChange={handleNameChange}
          backPath={`/dashboard/menu/${category.menu_id}`}
        />
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Kategoriyi Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Kategori ile birlikte aşağıdaki veriler de silinecektir:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Tüm ürünler</li>
                  <li>Ürün fiyatları</li>
                  <li>Ürün fotoğrafları</li>
                  <li>Ürün etiketleri</li>
                  <li>Ürün alerjenleri</li>
                </ul>
              </div>
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
          <Button variant="outline" className="w-[180px]">
            <Plus className="w-4 h-4 mr-2" />
            Kampanyalı Ürün
          </Button>
          <Dialog open={addProductDialogOpen} onOpenChange={handleAddProductDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={() => setAddProductDialogOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent
              className="w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Ürün Ekle
                </DialogTitle>
              </DialogHeader>

              <AddProductForm
                onSubmit={handleProductSubmit}
                units={units}
                onCancel={() => setAddProductDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-2 items-start">
        <Card className="w-full lg:w-auto self-start">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="relative w-full h-48 lg:w-48">
                <Image
                  src={category.cover_image || "/no-image.jpg"}
                  alt={category.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <Dialog>
                <Button variant="outline" asChild className="w-full">
                  <DialogTrigger>Fotoğrafı Güncelle</DialogTrigger>
                </Button>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader>
                    <DialogTitle>Kategori Fotoğrafını Güncelle</DialogTitle>
                  </DialogHeader>

                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fotoğraf boyutu en fazla 5MB ve minimum 350x350 piksel
                      olmalıdır.
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
          </CardContent>
        </Card>

        <ProductsTable
          products={sortedProducts}
          onStatusChange={handleProductStatusChange}
          units={units}
          onUpdate={fetchCategory}
          onDelete={handleProductsDelete}
        />
      </div>
    </div>
  );
};

export default CategoryDetail;
