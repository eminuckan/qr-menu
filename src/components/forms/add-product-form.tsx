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
import { ColorPicker } from "@/components/ui/color-picker";
import { UnitSelect } from "@/components/ui/unit-select";
import { Tables, Database } from '@/lib/types/supabase';
import { Loader2, Check } from "lucide-react";
import { AllergenLabels, ProductTagLabels } from "@/lib/constants";
import toast from "react-hot-toast";

interface AddProductFormProps {
    units: Tables<'units'>[];
    onSubmit: (data: ProductFormValues) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function AddProductForm({
    units,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: AddProductFormProps) {
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
            category_id: ""
        }
    });

    const handleSubmit = async (values: ProductFormValues) => {
        try {
            await onSubmit(values);
            form.reset();
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
                    <div className="lg:col-span-2">
                        <FormField
                            control={form.control}
                            name="prices.0.unit_id"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-sm font-medium">Birim</FormLabel>
                                    <FormControl>
                                        <UnitSelect
                                            units={units}
                                            value={field.value}
                                            onValueChange={field.onChange}
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
                        name="prices.0.price"
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