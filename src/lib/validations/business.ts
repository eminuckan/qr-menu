import * as z from "zod";

export const businessFormSchema = z.object({
    name: z
        .string()
        .min(2, "İşletme adı en az 2 karakter olmalıdır")
        .max(50, "İşletme adı en fazla 50 karakter olabilir"),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>; 