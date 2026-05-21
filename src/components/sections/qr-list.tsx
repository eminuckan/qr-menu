"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Delete02Icon,
  Download01Icon,
  PencilEdit01Icon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/console-primitives";
import { QRService } from "@/lib/services/qr-service";
import type { Tables } from "@/lib/types/supabase";

export const QRList = ({
  onEdit,
  selectedBusinessId,
}: {
  onEdit: (qr: Tables<"qr_codes">) => void;
  selectedBusinessId: string;
}) => {
  const [qrCodes, setQRCodes] = useState<Tables<"qr_codes">[]>([]);
  const [qrToDelete, setQrToDelete] = useState<Tables<"qr_codes"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const codes = await QRService.getQRCodes(selectedBusinessId);
        setQRCodes(codes);
      } catch {
        toast.error("QR kodları yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    if (selectedBusinessId) void load();
  }, [selectedBusinessId]);

  const handleDelete = async () => {
    if (!qrToDelete) return;
    try {
      await QRService.deleteQRCode(qrToDelete.id);
      setQRCodes(qrCodes.filter((qr) => qr.id !== qrToDelete.id));
      toast.success("QR kod silindi");
    } catch {
      toast.error("QR kod silinirken bir hata oluştu");
    } finally {
      setQrToDelete(null);
    }
  };

  const handleDownload = async (qr: Tables<"qr_codes">, type: "svg" | "pdf") => {
    try {
      const fileName = `qr-${qr.name.toLowerCase().replace(/\s+/g, "-")}`;
      const path = type === "svg" ? qr.svg_path : qr.pdf_path;
      if (!path) {
        toast.error(`${type.toUpperCase()} dosyası bulunamadı`);
        return;
      }
      const response = await fetch(path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${fileName}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Dosya indirilemedi");
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <EmptyState
        title="QR kodu yok"
        description="Sağ üstteki “Yeni QR kodu” butonuyla ilk QR kodunu oluşturun."
        icon={QrCodeIcon}
      />
    );
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {qrCodes.map((qr) => (
          <li
            key={qr.id}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex size-24 items-center justify-center rounded-md bg-muted/40 sm:size-28">
              <img
                src={qr.svg_path || "/no-qr.svg"}
                alt={qr.name}
                className="h-full w-full object-contain p-2"
              />
            </div>
            <div className="flex min-w-0 flex-col justify-between gap-2">
              <div>
                <h3 className="truncate text-sm font-semibold">{qr.name}</h3>
                {qr.qr_url ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">{qr.qr_url}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button variant="outline" size="xs" onClick={() => onEdit(qr)}>
                  <HugeIcon icon={PencilEdit01Icon} size={12} />
                  Düzenle
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="xs">
                      <HugeIcon icon={Download01Icon} size={12} />
                      İndir
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => void handleDownload(qr, "svg")}>
                      SVG olarak indir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleDownload(qr, "pdf")}>
                      PDF olarak indir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setQrToDelete(qr)}
                >
                  <HugeIcon icon={Delete02Icon} size={12} />
                  Sil
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!qrToDelete} onOpenChange={() => setQrToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR kodu sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bağlı yayın bağlantısı varsa müşteri kontrolü kaybedilebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
