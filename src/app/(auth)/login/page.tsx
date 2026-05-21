import { LoginForm } from "@/components/forms/LoginForm";
import { ChefHatIcon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/ui/huge-icon";
import Link from "next/link";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

function getSafeNext(next?: string) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = getSafeNext(params?.next);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f6f4] px-4 py-10 text-foreground">
      <HugeIcon icon={QrCodeIcon} className="pointer-events-none absolute -right-24 -top-24 size-96 text-zinc-200" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-lg border bg-white shadow-sm lg:grid-cols-[1fr_420px]">
        <div className="hidden min-h-[560px] flex-col justify-between border-r bg-zinc-950 p-8 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-white text-zinc-950">
              <HugeIcon icon={ChefHatIcon} className="size-5" />
            </div>
            <span className="text-base font-semibold">QRFloww</span>
          </div>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">Restoran operasyonunuzu tek panelden yönetin.</h1>
            <p className="text-base leading-7 text-zinc-300">
              Menüleri, QR kodları, işletme ayarlarını ve içe aktarma süreçlerini güvenli oturumla yönetin.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm text-zinc-300">
            <div className="rounded-md border border-white/10 p-3">
              <strong className="block text-white">Menü</strong>
              Canlı içerik
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <strong className="block text-white">QR</strong>
              Yayın takibi
            </div>
            <div className="rounded-md border border-white/10 p-3">
              <strong className="block text-white">Auth</strong>
              SSR oturum
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-md bg-zinc-950 text-white">
              <HugeIcon icon={ChefHatIcon} className="size-5" />
            </div>
            <span className="font-semibold">QRFloww</span>
          </div>
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Giriş yap</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Yönetim paneline devam etmek için hesabınızla giriş yapın.
            </p>
          </div>
          <LoginForm next={next} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
              Hesap oluşturun
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
