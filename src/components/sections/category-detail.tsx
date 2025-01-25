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
import type {
  CategoryWithProducts,
  Unit,
  ProductWithDetails,
} from "@/types/database";
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
import { ProductForm } from "../forms/product-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { CategoryService } from "@/lib/services/category-service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CategoryDetail = ({ id }: { id: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [sortedProducts, setSortedProducts] = useState<ProductWithDetails[]>(
    []
  );

  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      color: "",
      calories: 0,
      preparing_time: 0,
      allergens: [],
      tags: [],
      unit_id: "",
      price: 0,
      description: "",
    },
  });

  const handleImageDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("category-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      if (!data?.path) throw new Error("Dosya yolu alınamadı");

      const {
        data: { publicUrl },
      } = supabase.storage.from("category-images").getPublicUrl(data.path);

      const { error: updateError } = await supabase
        .from("categories")
        .update({ cover_image: publicUrl })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Başarılı",
        description: "Fotoğraf başarıyla güncellendi",
      });

      setCategory((prev) =>
        prev ? { ...prev, cover_image: publicUrl } : null
      );
    } catch (error) {
      console.error("Error details:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Fotoğraf yüklenirken bir hata oluştu",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fetchCategory = async () => {
    setIsLoading(true);
    try {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (categoryError) {
        console.error("Category fetch error:", categoryError);
        throw categoryError;
      }

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          product_prices!product_prices_product_id_fkey (
            id,
            price,
            unit_id,
            units!product_prices_unit_id_fkey (
              id,
              name
            )
          ),
          product_allergens!product_allergens_product_id_fkey (
            id,
            allergen
          ),
          product_tags!product_tags_product_id_fkey (
            id,
            tag_type
          ),
          product_images!product_images_product_id_fkey (
            id,
            image_url,
            is_cover,
            sort_order
          )
        `)
        .eq("category_id", id)
        .order("sort_order");

      if (productsError) {
        console.error("Products fetch error:", productsError);
        throw productsError;
      }

      const categoryWithProducts = {
        ...category,
        products: products || []
      };

      setCategory(categoryWithProducts);
      setSortedProducts(products || []);
    } catch (error) {
      console.error("Kategori çekme hatası:", error);
      throw error;
    } finally {
      setIsLoading(false);
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

  const handleNameChange = async (newName: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: newName })
        .eq("id", id);

      if (error) throw error;

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

  const handleProductSubmit = async (data: ProductFormValues) => {
    try {
      const result = await ProductService.createProduct(data, id);

      toast({
        title: "Başarılı",
        description: "Ürün başarıyla eklendi",
      });

      await fetchCategory();
      return result;
    } catch (error) {
      console.error('Ürün ekleme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ürün eklenirken bir hata oluştu",
      });
      throw error;
    }
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
      console.error('Ürün silme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürünler silinirken bir hata oluştu",
      });
    }
  };

  const handleProductStatusChange = (productId: string, newStatus: boolean) => {
    if (category) {
      setCategory((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          products: prev.products.map((product) =>
            product.id === productId
              ? { ...product, is_active: newStatus }
              : product
          ) as ProductWithDetails[],
        };
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
      console.error('Kategori silme hatası:', error);
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
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Ürün Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Ürün Ekle
                </DialogTitle>
              </DialogHeader>

              <ProductForm
                onSubmit={handleProductSubmit}
                units={units}
                onCancel={() => { }}
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
