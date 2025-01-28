import { z } from "zod"
import { Database } from "@/lib/types/supabase"

type Tables = Database["public"]["Tables"]
type Enums = Database["public"]["Enums"]

export const productFormSchema = z.object({
  name: z.string().min(1, "Ürün adı zorunludur"),
  description: z.string().optional(),
  color: z.string().optional(),
  calories: z.coerce.number().optional(),
  preparing_time: z.coerce.number().optional(),
  category_id: z.string(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
  allergens: z.array(z.enum(["gluten", "shellfish", "fish", "eggs", "dairy", "nuts", "peanuts", "wheat", "sulfur_dioxide", "mustard", "sesame", "soy", "lupin", "celery"] as const)).optional(),
  tags: z.array(z.enum(["new", "signature", "chef_recommendation", "popular", "vegan", "special"] as const)).optional(),
  prices: z.array(z.object({
    price: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
    unit_id: z.string()
  }))
})

export type ProductFormValues = z.infer<typeof productFormSchema> 