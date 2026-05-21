"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircleIcon, CheckCircle, Loading03Icon } from "@hugeicons/core-free-icons";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import { cn } from "@/lib/utils";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/lib/auth/actions";
import { initialAuthState, type AuthActionState } from "@/lib/auth/state";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function FormMessage({ state }: { state: AuthActionState }) {
  if (!state.message) {
    return null;
  }

  const isSuccess = state.status === "success";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm leading-5",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-destructive/25 bg-destructive/10 text-destructive"
      )}
    >
      {isSuccess ? (
        <HugeIcon icon={CheckCircle} className="mt-0.5 size-4" />
      ) : (
        <HugeIcon icon={AlertCircleIcon} className="mt-0.5 size-4" />
      )}
      <span>{state.message}</span>
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10 w-full text-sm" disabled={pending}>
      {pending ? <HugeIcon icon={Loading03Icon} className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, formAction] = useActionState(signInAction, initialAuthState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <div className="space-y-2">
        <Label htmlFor="email" className={cn(emailError && "text-destructive")}>
          E-posta
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          className={cn("h-10 text-sm", emailError && "border-destructive")}
        />
        <FieldError message={emailError} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password" className={cn(passwordError && "text-destructive")}>
            Parola
          </Label>
          <Link href="/forgot-password" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Şifremi unuttum
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className={cn("h-10 text-sm", passwordError && "border-destructive")}
        />
        <FieldError message={passwordError} />
      </div>
      <SubmitButton>Giriş yap</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialAuthState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];
  const confirmPasswordError = state.fieldErrors?.confirmPassword?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="space-y-2">
        <Label htmlFor="email" className={cn(emailError && "text-destructive")}>
          E-posta
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          className={cn("h-10 text-sm", emailError && "border-destructive")}
        />
        <FieldError message={emailError} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={cn(passwordError && "text-destructive")}>
          Şifre
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          className={cn("h-10 text-sm", passwordError && "border-destructive")}
        />
        <FieldError message={passwordError} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={cn(confirmPasswordError && "text-destructive")}>
          Şifre tekrarı
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          className={cn("h-10 text-sm", confirmPasswordError && "border-destructive")}
        />
        <FieldError message={confirmPasswordError} />
      </div>
      <SubmitButton>Hesap oluştur</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialAuthState);
  const emailError = state.fieldErrors?.email?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="space-y-2">
        <Label htmlFor="email" className={cn(emailError && "text-destructive")}>
          E-posta
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          className={cn("h-10 text-sm", emailError && "border-destructive")}
        />
        <FieldError message={emailError} />
      </div>
      <SubmitButton>Sıfırlama bağlantısı gönder</SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialAuthState);
  const passwordError = state.fieldErrors?.password?.[0];
  const confirmPasswordError = state.fieldErrors?.confirmPassword?.[0];

  return (
    <form action={formAction} className="space-y-4">
      <FormMessage state={state} />
      <div className="space-y-2">
        <Label htmlFor="password" className={cn(passwordError && "text-destructive")}>
          Yeni parola
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          className={cn("h-10 text-sm", passwordError && "border-destructive")}
        />
        <FieldError message={passwordError} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className={cn(confirmPasswordError && "text-destructive")}>
          Yeni parola tekrarı
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          className={cn("h-10 text-sm", confirmPasswordError && "border-destructive")}
        />
        <FieldError message={confirmPasswordError} />
      </div>
      <SubmitButton>Parolayı güncelle</SubmitButton>
    </form>
  );
}
