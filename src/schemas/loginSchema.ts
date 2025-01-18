import { z } from "zod"

export const loginSchema = z.object({
    email: z.string({message: "Email alanı boş olamaz"}).email({message: "Geçersiz email adresi"}),
    password: z.string({message: "Parola alanı boş olamaz"})
})

