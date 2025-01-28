"use client"

import { type ProductFormValues } from "@/lib/validations/product";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema } from "@/lib/validations/product";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiSelectInput } from "@/components/ui/multi-select-input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { UnitSelect } from "@/components/ui/unit-select";
import { cn } from "@/lib/utils";
import { Tables, Database } from '@/lib/types/supabase';
import { Loader2, Check, X } from "lucide-react";
import { AllergenLabels, ProductTagLabels } from "@/lib/constants";
import toast from "react-hot-toast";

type ProductWithDetails = Tables<'products'> & {
    product_allergens: Tables<'product_allergens'>[];
    product_tags: Tables<'product_tags'>[];
    product_prices: (Tables<'product_prices'> & {
        unit: Tables<'units'>;
    })[];
    product_images: Tables<'product_images'>[];
};

export interface FormProductImage {
    file?: File;
    preview: string;
    is_cover: boolean;
    id?: string;
    isExisting?: boolean;
}

interface EditProductFormProps {
    units: Tables<'units'>[];
    product: ProductWithDetails;
    onSubmit: (data: ProductFormValues, images: FormProductImage[]) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function EditProductForm({
    units,
    product,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: EditProductFormProps) {
    const [productImages, setProductImages] = useState<FormProductImage[]>([]);

    const defaultValues: ProductFormValues = {
        name: product.name,
        description: product.description ?? "",
        color: product.color ?? "",
        calories: product.calories ?? 0,
        preparing_time: product.preparing_time ?? 0,
        allergens: product.product_allergens?.map(a => a.allergen as Database["public"]["Enums"]["allergen_type"]) ?? [],
        tags: product.product_tags?.map(t => t.tag_type as Database["public"]["Enums"]["product_tag_type"]) ?? [],
        prices: product.product_prices?.map(price => ({
            unit_id: price.unit.id,
            price: price.price
        })) ?? [{
            unit_id: "",
            price: 0
        }],
        is_active: product.is_active ?? true,
        sort_order: product.sort_order ?? 0,
        category_id: product.category_id ?? ""
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues
    });

    // Form değerlerini product değiştiğinde güncelle
    useEffect(() => {
        const values: ProductFormValues = {
            name: product.name,
            description: product.description ?? "",
            color: product.color ?? "",
            calories: product.calories ?? 0,
            preparing_time: product.preparing_time ?? 0,
            allergens: product.product_allergens?.map(a => a.allergen as Database["public"]["Enums"]["allergen_type"]) ?? [],
            tags: product.product_tags?.map(t => t.tag_type as Database["public"]["Enums"]["product_tag_type"]) ?? [],
            prices: product.product_prices?.map(price => ({
                unit_id: price.unit.id,
                price: price.price
            })) ?? [{
                unit_id: "",
                price: 0
            }],
            is_active: product.is_active ?? true,
            sort_order: product.sort_order ?? 0,
            category_id: product.category_id ?? ""
        };

        // Her alan için ayrı ayrı setValue kullan
        Object.keys(values).forEach((key) => {
            form.setValue(key as keyof ProductFormValues, values[key as keyof ProductFormValues], {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true
            });
        });
    }, [product, form]);

    // Fotoğrafları yükle
    useEffect(() => {
        if (product.product_images?.length) {
            const existingImages = product.product_images.map(img => ({
                preview: img.image_url ?? "",
                is_cover: img.is_cover ?? false,
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

    const handleSubmit = async (values: ProductFormValues) => {
        try {
            await onSubmit(values, productImages);
            form.reset();
            setProductImages([]);
        } catch (error) {
            console.error("Form submit error:", error);
            toast.error(error instanceof Error ? error.message : "Ürün kaydedilirken bir hata oluştu");
        }
    };

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
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">Ürün rengi</FormLabel>
                                <FormControl>
                                    <ColorPicker {...field} />
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
                                    <Input
                                        type="number"
                                        placeholder="kcal"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
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
                                    <Input
                                        type="number"
                                        placeholder="dakika"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
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
                                            value: key as Database['public']['Enums']['allergen_type'],
                                            label,
                                        }))}
                                        value={field.value?.map(allergen => ({
                                            value: allergen as Database['public']['Enums']['allergen_type'],
                                            label: AllergenLabels[allergen as Database['public']['Enums']['allergen_type']],
                                        })) || []}
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
                                            value: key as Database['public']['Enums']['product_tag_type'],
                                            label,
                                        }))}
                                        value={field.value?.map(tag => ({
                                            value: tag as Database['public']['Enums']['product_tag_type'],
                                            label: ProductTagLabels[tag as Database['public']['Enums']['product_tag_type']],
                                        })) || []}
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
                    {form.watch('prices')?.map((_, index) => (
                        <div key={index} className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                                <FormField
                                    control={form.control}
                                    name={`prices.${index}.unit_id`}
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-sm font-medium">Birim</FormLabel>
                                            <FormControl>
                                                <UnitSelect
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    units={units}
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
                                name={`prices.${index}.price`}
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-medium">Fiyat</FormLabel>
                                        <FormControl>
                                            <div className="relative flex items-center">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0"
                                                    className="pr-16"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value === "" ? 0 : Number(e.target.value);
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
                    ))}
                </div>

                <div className="space-y-4">
                    <FileDropzone onDrop={handleImageDrop} />

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {productImages.map((image, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img
                                    src={image.preview}
                                    alt={`Ürün fotoğrafı ${index + 1}`}
                                    className={cn(
                                        "w-full h-full object-cover rounded-lg transition-all duration-300",
                                        image.is_cover && "ring-2 ring-primary"
                                    )}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => handleCoverSelect(index)}
                                    >
                                        {image.is_cover ? (
                                            <Check className="h-4 w-4 text-white" />
                                        ) : (
                                            <span className="h-4 w-4 rounded-full border-2 border-white" />
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => handleImageRemove(index)}
                                    >
                                        <X className="h-4 w-4 text-white" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Controller
                        control={form.control}
                        name="description"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-medium">Açıklama</FormLabel>
                                <FormControl>
                                    <TiptapEditor {...field} />
                                </FormControl>
                                {fieldState.error && (
                                    <FormMessage>{fieldState.error.message}</FormMessage>
                                )}
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Kaydediliyor
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Kaydet
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
} 