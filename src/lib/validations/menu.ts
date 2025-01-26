import * as z from "zod";

export const menuFormSchema = z.object({
    name: z
        .string()
        .min(2, "Menü adı en az 2 karakter olmalıdır")
        .max(50, "Menü adı en fazla 50 karakter olabilir"),
    business_id: z
        .string()
        .min(1, "İşletme seçmelisiniz")
});

export type MenuFormValues = z.infer<typeof menuFormSchema>; 