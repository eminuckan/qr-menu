import { z } from "zod";

export const emailSchema = z.object({
  email: z
    .string({ message: "E-posta alanı boş olamaz." })
    .trim()
    .email({ message: "Geçerli bir e-posta adresi girin." }),
});

export const signInSchema = emailSchema.extend({
  password: z.string({ message: "Parola alanı boş olamaz." }).min(1, "Parola alanı boş olamaz."),
  next: z.string().optional(),
});

export const signUpSchema = emailSchema
  .extend({
    password: z
      .string({ message: "Parola alanı boş olamaz." })
      .min(8, "Parola en az 8 karakter olmalıdır."),
    confirmPassword: z.string({ message: "Parola tekrarı boş olamaz." }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Parolalar eşleşmiyor.",
    path: ["confirmPassword"],
  });

export const updatePasswordSchema = z
  .object({
    password: z
      .string({ message: "Yeni parola alanı boş olamaz." })
      .min(8, "Yeni parola en az 8 karakter olmalıdır."),
    confirmPassword: z.string({ message: "Parola tekrarı boş olamaz." }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Parolalar eşleşmiyor.",
    path: ["confirmPassword"],
  });
