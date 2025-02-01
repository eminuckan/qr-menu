import Image from "next/image";
import { GridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PricingCard } from "@/components/ui/pricing-card";

const pricingPlans = [
  {
    title: "Free Plan",
    price: {
      monthly: 0,
      yearly: 0
    },
    description: "Temel QR menü özellikleri.",
    features: [
      "1 QR Menü",
      "500 MB Depolama",
      "1 İşletme",
      "3 Kullanıcı",
      "Temel Raporlama"
    ],
    isPopular: false,
    buttonVariant: "secondary" as const
  },
  {
    title: "Pro Plan",
    price: {
      monthly: 299,
      yearly: 251
    },
    description: "Gelişmiş özellikler ve daha fazla kapasite.",
    features: [
      "5 QR Menü",
      "5 GB Depolama",
      "3 İşletme",
      "10 Kullanıcı",
      "Gelişmiş Raporlama",
      "7/24 Destek"
    ],
    isPopular: true,
    buttonVariant: "primary" as const
  },
  {
    title: "Plus Plan",
    price: {
      monthly: 599,
      yearly: 503
    },
    description: "Sınırsız özellikler ve maksimum kapasite.",
    features: [
      "Sınırsız QR Menü",
      "20 GB Depolama",
      "Sınırsız İşletme",
      "Sınırsız Kullanıcı",
      "Özel Raporlama",
      "Öncelikli 7/24 Destek"
    ],
    isPopular: false,
    buttonVariant: "secondary" as const
  }
];

export default function Home() {
  return (
    <div className="flex flex-col items-center bg-landing-background min-h-screen">
      {/* Ana Gradient Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--landing-primary)/0.08),hsl(var(--landing-primary)/0))] -z-30" />
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay -z-20" />

      {/* Hero Section */}
      <section className="container relative min-h-[calc(100vh-80px)] py-24">
        <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto mb-16 z-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-landing-text mb-6">
            QR Floww ile
            <br />
            <span className="bg-gradient-to-r from-landing-primary to-landing-accent bg-clip-text text-transparent">
              Menünüzü Dijitalleştirin
            </span>
          </h1>
          <p className="text-lg text-landing-text/60 mb-8 max-w-2xl">
            QR Floww menü sistemi ile işletmenizi dijitalleştirin, müşterilerinize modern ve kolay bir menü deneyimi sunun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              className="inline-flex h-12 items-center justify-center rounded-full bg-landing-primary px-8 text-sm font-medium text-landing-primary-foreground shadow-lg transition-all hover:scale-105"
              href="/register"
            >
              Ücretsiz Başla
            </a>
            <a
              className="inline-flex h-12 items-center justify-center rounded-full bg-landing-secondary px-8 text-sm font-medium text-landing-secondary-foreground shadow-lg transition-all hover:scale-105 border border-landing-primary/10"
              href="#features"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Daha Fazla Bilgi
            </a>
          </div>
        </div>
        <div className="absolute inset-0 z-10">
          <GridPattern
            numSquares={30}
            maxOpacity={0.5}
            duration={3}
            repeatDelay={1}
            className={cn(
              '[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]',
              'inset-x-0 inset-y-[-30%] h-[100%] w-[100%] skew-y-12',
            )}
          />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Temel QR Menü */}
          <div className="bg-landing-background rounded-3xl p-8 border border-landing-primary/10 shadow-lg hover:border-landing-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-landing-text">Temel QR Menü</h3>
                <p className="text-sm text-landing-text/60">Kolay menü oluşturma ve yönetimi</p>
              </div>
            </div>
            <ul className="space-y-3 text-landing-text/60">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sınırsız kategori ve ürün ekleme
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fiyat ve stok yönetimi
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ürün görselleri ve açıklamaları
              </li>
            </ul>
          </div>

          {/* Özelleştirmeler */}
          <div className="bg-landing-background rounded-3xl p-8 border border-landing-primary/10 shadow-lg hover:border-landing-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-landing-text">Özelleştirmeler</h3>
                <p className="text-sm text-landing-text/60">Markanıza özel tasarım</p>
              </div>
            </div>
            <ul className="space-y-3 text-landing-text/60">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Özel tema ve renk seçenekleri
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Logo ve marka entegrasyonu
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Özel alan adı desteği
              </li>
            </ul>
          </div>

          {/* Raporlar ve Analizler */}
          <div className="bg-landing-background rounded-3xl p-8 border border-landing-primary/10 shadow-lg hover:border-landing-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-landing-text">Raporlar ve Analizler</h3>
                <p className="text-sm text-landing-text/60">Detaylı istatistikler</p>
              </div>
            </div>
            <ul className="space-y-3 text-landing-text/60">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                QR kod tarama analizleri
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Popüler ürün raporları
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-landing-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ziyaretçi istatistikleri
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-landing-text mb-4">
            Neden QR Floww?
          </h2>
          <p className="text-lg text-landing-text/60">
            Modern ve kullanıcı dostu arayüzümüz ile işletmenizin dijital dönüşümünü kolaylaştırıyoruz.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-landing-text mb-3">Hızlı Kurulum</h3>
            <p className="text-landing-text/60">Dakikalar içinde menünüzü oluşturun ve QR kodunuzu alın.</p>
          </div>
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-landing-text mb-3">Kolay Yönetim</h3>
            <p className="text-landing-text/60">Menünüzü istediğiniz zaman güncelleyin, kategoriler oluşturun.</p>
          </div>
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-landing-primary/10 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-landing-text mb-3">Güvenli Sistem</h3>
            <p className="text-landing-text/60">Verileriniz güvende, sisteminiz 7/24 aktif.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-landing-text mb-4">
            Size uygun planı seçin
          </h2>
          <p className="text-lg text-landing-text/60">
            Her işletmeye özel fiyatlandırma seçenekleri
          </p>
        </div>

        <Tabs defaultValue="monthly" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="monthly">Aylık Ödeme</TabsTrigger>
              <TabsTrigger value="yearly">Yıllık Ödeme %16 İndirim</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  title={plan.title}
                  price={plan.price.monthly}
                  description={plan.description}
                  features={plan.features}
                  isPopular={plan.isPopular}
                  buttonVariant={plan.buttonVariant}
                  period="monthly"
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yearly">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  title={plan.title}
                  price={plan.price.yearly}
                  description={plan.description}
                  features={plan.features}
                  isPopular={plan.isPopular}
                  buttonVariant={plan.buttonVariant}
                  period="yearly"
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-landing-text mb-4">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-lg text-landing-text/60">
            İşletme sahiplerinin QR Floww deneyimleri
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-landing-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-landing-primary">A</span>
              </div>
              <div>
                <h4 className="font-semibold text-landing-text">Ahmet Yılmaz</h4>
                <p className="text-sm text-landing-text/60">Cafe Sahibi</p>
              </div>
            </div>
            <p className="text-landing-text/60">
              "QR Floww sayesinde menümüzü dijitalleştirdik ve müşterilerimizden çok olumlu geri dönüşler aldık. Kullanımı çok kolay ve pratik."
            </p>
          </div>
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-landing-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-landing-primary">M</span>
              </div>
              <div>
                <h4 className="font-semibold text-landing-text">Mehmet Demir</h4>
                <p className="text-sm text-landing-text/60">Restaurant Sahibi</p>
              </div>
            </div>
            <p className="text-landing-text/60">
              "Menü güncelleme işlemlerimiz artık çok daha hızlı. Fiyat değişikliklerini anında yapabiliyoruz. Harika bir sistem!"
            </p>
          </div>
          <div className="bg-landing-background p-8 rounded-3xl shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-landing-primary/10 flex items-center justify-center">
                <span className="text-xl font-semibold text-landing-primary">Z</span>
              </div>
              <div>
                <h4 className="font-semibold text-landing-text">Zeynep Kaya</h4>
                <p className="text-sm text-landing-text/60">Pastane Sahibi</p>
              </div>
            </div>
            <p className="text-landing-text/60">
              "Müşterilerimiz QR menümüzü çok beğeniyor. Özellikle fotoğraflı menü seçeneği sayesinde ürünlerimizi daha iyi sergileyebiliyoruz."
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
