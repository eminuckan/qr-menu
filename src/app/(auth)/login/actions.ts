"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { loginSchema } from "@/schemas/loginSchema"
import { createClient } from "@/lib/supabase/server"

export interface LoginState {
    errors?: {
        [key: string]: string[];
    }
    isPending?: boolean;
    success: boolean;
    email: string;
    password: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    const validatedData = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    });


    if (!validatedData.success) {
        return {
            errors: validatedData.error.flatten().fieldErrors,
            isPending: false,
            success: false,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.data.email,
        password: validatedData.data.password,
    });

    if (error) {
        return {
            errors: {
                SUPABASE_ERROR: [error.code === "invalid_credentials" ? "Email veya şifre hatalı." : "Bir hata oluştu lütfen daha sonra tekrar deneyiniz."],
            },
            isPending: false,
            success: false,
            email: validatedData.data.email,
            password: validatedData.data.password,
        }
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

