import React, { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/app/(auth)/login/actions";
import { toast, useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils";


export const LoginForm = () => {
  const [state, formAction, isPending] = useActionState(login, {
    success: false,
    email: "",
    password: "",
  });

  React.useEffect(() => {
    if (!state.success) {
        console.log(state.errors)
      toast({
        description: state.errors?.SUPABASE_ERROR?.[0],
        variant: "destructive",
      });
    }
  }, [state.success]);


  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className={cn("text-stone-600", state.errors?.email && "text-red-500")}>
          E-posta
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="ornek@email.com"
            required
            defaultValue={state.email}
            className={cn("pl-4 transition-all duration-300 focus:ring-2 focus:ring-stone-400", state.errors?.email && "border-red-500")}
          />
          {state.errors?.email && <p className="text-red-500 text-sm">{state.errors?.email?.[0]}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={cn("text-stone-600", state.errors?.password && "text-red-500")}>
          Şifre
        </Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            name="password"
            required
            defaultValue={state.password}
            className={cn("pl-4 transition-all duration-300 focus:ring-2 focus:ring-stone-400", state.errors?.password && "border-red-500")}
          />
          {state.errors?.password && <p className="text-red-500 text-sm">{state.errors?.password?.[0]}</p>}
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-stone-800 hover:bg-stone-900 text-white transition-all duration-300 hover:shadow-lg"
      >
        Giriş Yap
      </Button>
    </form>
  );
};
