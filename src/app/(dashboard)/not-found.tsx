import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Geometrik Şekiller - Sol Alt */}
      <div className="absolute left-10 bottom-10 flex gap-4">
        <div className="w-16 h-16 bg-black transform rotate-45" />
        <div className="w-16 h-16 bg-black rounded-full" />
        <div className="w-16 h-16 bg-black"
          style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
        <div className="w-16 h-16 bg-black rounded-[40%]" />
      </div>

      {/* Geometrik Şekiller - Sağ Üst */}
      <div className="absolute right-10 top-20 flex gap-4">
        <div className="w-12 h-12 bg-black" />
        <div className="w-12 h-12 bg-black rounded-full" />
        <div className="w-3 h-3 bg-black rounded-full self-end" />
      </div>

      {/* Ana İçerik */}
      <div className="text-center z-10 px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter">
          Bu sayfayı bulamadık.
        </h1>
        <Link
          href="/dashboard"
          className="text-lg border-b-2 border-black pb-1 hover:pb-2 transition-all"
        >
          Ana sayfa ↵
        </Link>
      </div>
    </div>
  );
}