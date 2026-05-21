import { ChefHatIcon } from "@hugeicons/core-free-icons";

import { UpdatePasswordForm } from "@/components/forms/LoginForm";
import { HugeIcon } from "@/components/ui/huge-icon";

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
            <HugeIcon icon={ChefHatIcon} className="size-5" />
          </div>
          <span className="font-semibold">QRFloww</span>
        </div>
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Yeni parola belirleyin</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Bu işlem tamamlandığında yönetim paneline yönlendirileceksiniz.
          </p>
        </div>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}
