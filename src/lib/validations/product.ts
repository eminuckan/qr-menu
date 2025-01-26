import * as z from "zod"

export const productFormSchema = z.object({
  name: z
    .string()
    .min(2, "Ürün adı en az 2 karakter olmalıdır")
    .max(50, "Ürün adı en fazla 50 karakter olabilir"),
  color: z.string().optional(),
  calories: z.number().min(0, "Kalori negatif olamaz").optional(),
  preparing_time: z.number().min(0, "Hazırlanma süresi negatif olamaz").optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  unit_id: z.string().min(1, "Birim seçmelisiniz"),
  price: z.number().min(0, "Fiyat negatif olamaz"),
  description: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema> 