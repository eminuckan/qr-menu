import * as z from "zod"

export const productFormSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, "Geçersiz renk kodu").default("#FFFFFF"),
  calories: z.coerce.number().min(0, "Kalori negatif olamaz").optional().default(0),
  preparing_time: z.coerce.number().min(0, "Hazırlanma süresi negatif olamaz").optional().default(0),
  allergens: z.array(z.enum(['gluten', 'shellfish', 'fish', 'eggs', 'dairy', 'nuts', 'peanuts', 'wheat', 'sulfur_dioxide', 'mustard', 'sesame', 'soy', 'lupin', 'celery'] as const)).default([]),
  tags: z.array(z.enum(['new', 'signature', 'chef_recommendation', 'popular', 'vegan', 'special'] as const)).default([]),
  unit_id: z.string().min(1, "Birim seçmelisiniz"),
  price: z.coerce.number().min(0, "Fiyat negatif olamaz").default(0),
  description: z.string().optional().default(""),
})

export type ProductFormValues = z.infer<typeof productFormSchema> 