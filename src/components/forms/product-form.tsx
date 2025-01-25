"use client"

import { type ProductFormValues } from "@/lib/validations/product";
import { type Unit, type ProductWithDetails, AllergenType, ProductTagType, ProductImage } from "@/types/database";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema } from "@/lib/validations/product";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelectInput } from "@/components/ui/multi-select-input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { AllergenLabels, ProductTagLabels } from "@/types/database";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { UnitSelect } from "@/components/ui/unit-select";
import { DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FormProductImage {
  file?: File;
  preview: string;
  is_cover: boolean;
  id?: string;
  isExisting?: boolean;
}

interface ProductFormProps {
  units: Unit[];
  product?: ProductWithDetails;
  onSubmit: (data: ProductFormValues, images?: FormProductImage[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export function ProductForm({
  units,
  product,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEdit = false
}: ProductFormProps) {
  const [productImages, setProductImages] = useState<FormProductImage[]>([]);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? {
      name: product.name,
      color: product.color || "",
      calories: product.calories || 0,
      preparing_time: product.preparing_time || 0,
      allergens: product.product_allergens?.map(a => a.allergen) || [],
      tags: product.product_tags?.map(t => t.tag_type) || [],
      unit_id: product.product_prices?.[0]?.unit_id || "",
      price: product.product_prices?.[0]?.price || 0,
      description: product.description || "",
    } : {
      name: "",
      color: "",
      calories: 0,
      preparing_time: 0,
      allergens: [],
      tags: [],
      unit_id: "",
      price: 0,
      description: "",
    }
  });

  useEffect(() => {
    if (product?.product_images) {
      const existingImages = product.product_images.map(img => ({
        preview: img.image_url || "",
        is_cover: img.is_cover,
        id: img.id,
        isExisting: true
      }));
      setProductImages(existingImages);
    } else {
      setProductImages([]);
    }
  }, [product]);

  const handleImageDrop = async (files: File[]) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      is_cover: false,
      isExisting: false
    }));

    setProductImages(prev => {
      if (prev.length === 0 && newImages.length > 0) {
        newImages[0].is_cover = true;
      }
      return [...prev, ...newImages];
    });
  };

  const handleCoverSelect = (index: number) => {
    setProductImages(prev => prev.map((img, i) => ({
      ...img,
      is_cover: i === index
    })));
  };

  const handleImageRemove = (index: number) => {
    setProductImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (prev[index].is_cover && newImages.length > 0) {
        newImages[0].is_cover = true;
      }
      if (!prev[index].isExisting) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newImages;
    });
  };

  async function handleSubmit(values: ProductFormValues) {
    try {
      if (!values.unit_id || !units.some(u => u.id === values.unit_id)) {
        toast({
          title: "Geçersiz Birim",
          description: "Lütfen geçerli bir birim seçin",
          variant: "destructive"
        });
        return;
      }

      await onSubmit(values, productImages.length > 0 ? productImages : undefined);
    } catch (error) {
      console.error("Form gönderme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Ürün kaydedilemedi"
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 items-center">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Ürün Adı <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ürün adını girin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start gap-2">
                <FormLabel className="text-sm font-medium">
                  Ürün rengi
                </FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-3 items-center">
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {[
                        { value: "#FFFFFF", label: "Beyaz", bg: "bg-white" },
                        { value: "#FCA5A5", label: "Kırmızı", bg: "bg-red-300" },
                        { value: "#93C5FD", label: "Mavi", bg: "bg-blue-300" },
                        { value: "#86EFAC", label: "Yeşil", bg: "bg-green-300" },
                        { value: "#FDE047", label: "Sarı", bg: "bg-yellow-300" },
                        { value: "#D8B4FE", label: "Mor", bg: "bg-purple-300" },
                        { value: "#FDA4AF", label: "Pembe", bg: "bg-pink-300" },
                        { value: "#FDBA74", label: "Turuncu", bg: "bg-orange-300" },
                      ].map((color) => (
                        <div key={color.value} className="relative group">
                          <RadioGroupItem
                            value={color.value}
                            id={color.value}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={color.value}
                            className={`w-6 h-6 rounded-full ${color.bg} block ring-2 ring-offset-2 ring-transparent peer-data-[state=checked]:ring-black cursor-pointer transition-all duration-200 ease-in-out ${color.value === '#FFFFFF' ? 'border border-gray-200' : ''}`}
                          />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {color.label}
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                    <ColorPicker
                      color={field.value || '#000000'}
                      onChange={field.onChange}
                      className="w-6 h-6"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Kalori</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="kcal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preparing_time"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Hazırlanma Süresi</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="dakika" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="allergens"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Alerjenler</FormLabel>
                <FormControl>
                  <MultiSelectInput
                    options={Object.entries(AllergenLabels).map(([key, label]) => ({
                      value: key,
                      label,
                    }))}
                    value={field.value.map(allergen => ({
                      value: allergen,
                      label: AllergenLabels[allergen as AllergenType],
                    }))}
                    onChange={(newValue) => field.onChange(newValue.map(v => v.value))}
                    placeholder="Alerjen seçin"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Etiketler</FormLabel>
                <FormControl>
                  <MultiSelectInput
                    options={Object.entries(ProductTagLabels).map(([key, label]) => ({
                      value: key,
                      label,
                    }))}
                    value={field.value.map(tag => ({
                      value: tag,
                      label: ProductTagLabels[tag as ProductTagType],
                    }))}
                    onChange={(newValue) => field.onChange(newValue.map(v => v.value))}
                    placeholder="Etiket seçin"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Birim</FormLabel>
                  <FormControl>
                    <UnitSelect
                      units={units}
                      value={field.value}
                      onChange={field.onChange}
                      onUnitAdded={(newUnit) => {
                        units.push(newUnit);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Fiyat</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="0"
                      className="pr-16"
                      {...field}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value));
                        field.onChange(value);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="absolute right-1 px-3"
                      onClick={() => field.onChange(Number(field.value || 0) + 10)}
                    >
                      +10₺
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEdit && (
          <div className="space-y-4">
            <FileDropzone onDrop={handleImageDrop} />

            {/* Fotoğraf önizleme */}
            {productImages.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <div key={image.preview} className="relative flex flex-col bg-muted rounded-lg overflow-hidden">
                    <div className="relative aspect-square">
                      <img
                        src={image.preview}
                        alt={`Preview ${index}`}
                        className={cn(
                          "w-full h-full object-cover",
                          image.is_cover && "ring-2 ring-primary ring-offset-2"
                        )}
                      />
                      {image.is_cover && (
                        <div className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Kapak
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-background/80 backdrop-blur-sm border-t flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={image.is_cover}
                          onCheckedChange={() => handleCoverSelect(index)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <span className="text-xs text-muted-foreground">
                          {image.is_cover ? "Kapak" : "Kapak Yap"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleImageRemove(index)}
                        className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Açıklama</FormLabel>
                <FormControl>
                  <TiptapEditor
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                {fieldState.error && (
                  <FormMessage>{fieldState.error.message}</FormMessage>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" type="button" onClick={onCancel}>
              İptal
            </Button>
          </DialogClose>
          <Button type="submit">
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
} 