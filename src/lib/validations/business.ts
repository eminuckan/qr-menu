import * as z from "zod";

export const businessFormSchema = z.object({
    name: z.string().min(2, {
        message: "İşletme adı en az 2 karakter olmalıdır",
    }),
    slug: z.string().optional(),
});

export type BusinessFormValues = z.infer<typeof businessFormSchema>; 