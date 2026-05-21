"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import type { AuthActionState } from "@/lib/auth/state";

function safeRelativePath(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function getErrorMessage(errorCode?: string) {
  if (errorCode === "invalid_credentials") {
    return "E-posta veya parola hatalı.";
  }

  if (errorCode === "email_not_confirmed") {
    return "E-posta adresinizi doğrulamanız gerekiyor.";
  }

  if (errorCode === "weak_password") {
    return "Parola daha güçlü olmalıdır.";
  }

  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: getErrorMessage(error.code),
      values: { email: parsed.data.email },
    };
  }

  revalidatePath("/dashboard");
  redirect(safeRelativePath(parsed.data.next));
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: getErrorMessage(error.code),
      values: { email: parsed.data.email },
    };
  }

  if (data.session) {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: "Kayıt alındı. Devam etmek için e-posta adresinize gelen doğrulama bağlantısını açın.",
    values: { email: parsed.data.email },
  };
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: { email: String(formData.get("email") ?? "") },
    };
  }

  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    return {
      status: "error",
      message: "Parola sıfırlama e-postası gönderilemedi. Lütfen biraz sonra tekrar deneyin.",
      values: { email: parsed.data.email },
    };
  }

  return {
    status: "success",
    message: "Eğer bu e-posta ile kayıtlı bir hesap varsa parola sıfırlama bağlantısı gönderildi.",
    values: { email: parsed.data.email },
  };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Parola güncelleme oturumu bulunamadı. Yeni bir sıfırlama bağlantısı isteyin.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: getErrorMessage(error.code),
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
