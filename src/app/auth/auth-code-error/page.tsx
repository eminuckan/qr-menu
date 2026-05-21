import Link from "next/link";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex items-start gap-3">
          <HugeIcon icon={AlertCircleIcon} className="mt-0.5 size-5 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Bağlantı doğrulanamadı</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Oturum bağlantısı süresi dolmuş veya geçersiz olabilir. Yeni bir bağlantı isteyip tekrar deneyin.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Button asChild className="h-10 flex-1 text-sm">
            <Link href="/login">Girişe dön</Link>
          </Button>
          <Button asChild variant="outline" className="h-10 flex-1 text-sm">
            <Link href="/forgot-password">Parola sıfırla</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
