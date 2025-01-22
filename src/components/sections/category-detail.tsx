"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash,
  Edit2,
  Check,
  X,
} from "lucide-react";
import type { CategoryWithProducts, Product } from "@/types/database";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "nextjs-toploader/app";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


// Ürün tablosu için kolon tanımları
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Ürün Adı",
  },
  {
    accessorKey: "is_active",
    header: "Durum",
    cell: ({ row }) => {
      const is_active = row.getValue("is_active") as boolean;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {is_active ? "Aktif" : "Pasif"}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Fiyat",
    cell: () => "-",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <Button variant="ghost" size="sm">
            Düzenle
          </Button>
        </div>
      );
    },
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_WIDTH = 350;
const MIN_HEIGHT = 350;

const CategoryDetail = ({ id }: { id: string }) => {
  // useState hooks
  const [isDropzoneOpen, setIsDropzoneOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<CategoryWithProducts | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // other hooks
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  // useCallback hooks
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const isValid = await validateImage(file);
      if (!isValid) return;

      setIsUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;

        // Storage'a yükleme
        const { data, error: uploadError } = await supabase.storage
          .from("category-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          throw new Error(
            `Dosya yükleme hatası: ${uploadError.message || "Bilinmeyen hata"}`
          );
        }

        if (!data?.path) {
          throw new Error("Dosya yolu alınamadı");
        }

        // Public URL alma - bucket adını kontrol et
        const {
          data: { publicUrl },
        } = supabase.storage.from("category-images").getPublicUrl(data.path);

        console.log("path", data.path);

        console.log("Generated public URL:", publicUrl); // URL'yi kontrol etmek için

        // Kategori güncelleme
        const { error: updateError } = await supabase
          .from("categories")
          .update({ cover_image: publicUrl })
          .eq("id", id);

        if (updateError) {
          throw new Error(`Kategori güncelleme hatası: ${updateError.message}`);
        }

        toast({
          title: "Başarılı",
          description: "Fotoğraf başarıyla güncellendi",
        });

        setCategory((prev) =>
          prev ? { ...prev, cover_image: publicUrl } : null
        );
        setIsDropzoneOpen(false);
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
    },
    [id, supabase, toast, setIsDropzoneOpen]
  );

  // useEffect hooks
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select(
            `
            *,
            products:products(*)
          `
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        setCategory(data);
      } catch (error) {
        console.error("Error fetching category:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kategori bilgileri yüklenirken bir hata oluştu",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [id, supabase, toast]);

  useEffect(() => {
    if (category) {
      setEditedName(category.name);
    }
  }, [category]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
    onDrop,
  });

  const handleNameEdit = async () => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name: editedName })
        .eq("id", id);

      if (error) throw error;

      setCategory((prev) => (prev ? { ...prev, name: editedName } : null));
      setIsEditingName(false);

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

  const validateImage = async (file: File): Promise<boolean> => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır",
      });
      return false;
    }
    return true;
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!category) {
    return <div>Kategori bulunamadı.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full bg-black hover:bg-black/90 text-white hover:text-white border-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Button>

        <div className="flex items-center gap-2 min-h-[2.5rem] group w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <div className="w-fit">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-4xl font-bold h-auto py-1 px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNameEdit}
                  className="h-auto p-1"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(false)}
                  className="h-auto p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-4xl font-bold py-1">
                {category.name}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedName(category.name);
                  setIsEditingName(true);
                }}
                className="h-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                console.log("Seçili ürünler silinecek");
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Seçilenleri Sil
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-[180px]">
            <Plus className="w-4 h-4 mr-2" />
            Kampanyalı Ürün
          </Button>
          <Dialog>
            <Button asChild className="w-full sm:w-[140px]">
              <DialogTrigger>
                <Plus className="w-4 h-4 mr-2" />
                Ürün Ekle
              </DialogTrigger>
            </Button>
            <DialogContent className="sm:max-w-[1024px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Ürün Ekle</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Ürün Adı
                    </label>
                    <Input
                      id="name"
                      placeholder="Ürün adını giriniz"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tax_rate" className="text-sm font-medium">
                      KDV Oranı
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="KDV oranı seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">%1</SelectItem>
                        <SelectItem value="10">%10</SelectItem>
                        <SelectItem value="20">%20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Ürün Rengi
                    </label>
                    <RadioGroup className="flex flex-wrap gap-3 pt-3">
                      {[
                        { value: 'red', bg: 'bg-red-300' },
                        { value: 'blue', bg: 'bg-blue-300' },
                        { value: 'green', bg: 'bg-green-300' },
                        { value: 'yellow', bg: 'bg-yellow-200' },
                        { value: 'purple', bg: 'bg-purple-300' },
                        { value: 'pink', bg: 'bg-pink-300' },
                        { value: 'orange', bg: 'bg-orange-300' },
                      ].map((color) => (
                        <div key={color.value}>
                          <RadioGroupItem
                            value={color.value}
                            id={color.value}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={color.value}
                            className={`w-5 h-5 rounded-full ${color.bg} block ring-2 ring-offset-2 ring-transparent peer-data-[state=checked]:ring-black cursor-pointer transition-all duration-200 ease-in-out`}
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Açıklama
                  </label>
                
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button">
                    İptal
                  </Button>
                  <Button type="submit">
                    Kaydet
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Fotoğraf Card'ı */}
        <Card className="w-full lg:w-auto">
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
              <Button
                variant="outline"
                onClick={() => setIsDropzoneOpen(true)}
                className="w-full"
              >
                Fotoğrafı Güncelle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DataTable Card'ı */}
        <Card className="w-full">
          <CardContent className="p-0 overflow-x-auto">
            <DataTable
              columns={columns}
              data={category.products || []}
              searchKey="name"
              onRowSelectionChange={setRowSelection}
            />
          </CardContent>
        </Card>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={isDropzoneOpen} onOpenChange={setIsDropzoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori Fotoğrafını Güncelle</DialogTitle>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Fotoğraf boyutu en fazla 5MB olmalıdır.
            </AlertDescription>
          </Alert>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p>Yükleniyor...</p>
              </div>
            ) : (
              <p>Fotoğraf yüklemek için sürükleyin veya tıklayın</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryDetail;
