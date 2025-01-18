"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/schemas/loginSchema"

export interface LoginState {
    errors?: {
        [key: string]: string[];
    }
    isPending?: boolean;
    success: boolean;
    email: string;
    password: string;
}

export async function login(_prevState: LoginState,formData: FormData) : Promise<LoginState> {
    const supabase = await createClient()
  
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
    const validatedFields = loginSchema.safeParse(data)
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            email: data.email,
            password: data.password,
            success: false
        }
    }
  
    const { error } = await supabase.auth.signInWithPassword(validatedFields.data)
  
    if (error) {
        return {
            errors: {
                SUPABASE_ERROR: [error.message]
            },
            email: data.email,
            password: data.password,
            success: false
        }
    }
  
    revalidatePath('/', 'layout')
    redirect('/')
  }
  

  // içeride kullanılacak
  export async function signup(formData: FormData) {
    const supabase = await createClient()
  
    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }
  
    const { error } = await supabase.auth.signUp(data)
  
    if (error) {
      redirect('/error')
    }
  
    revalidatePath('/', 'layout')
    redirect('/')
  }
