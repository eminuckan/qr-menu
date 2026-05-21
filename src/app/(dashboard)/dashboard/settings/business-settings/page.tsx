"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Add01Icon,
  Building03Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  EntityStack,
  PageHeader,
  StatusBadge,
} from "@/components/ui/console-primitives";
import { BusinessService } from "@/lib/services/business-service";
import {
  businessFormSchema,
  type BusinessFormValues,
} from "@/lib/validations/business";
import { useBusinessContext } from "@/lib/contexts/business-context";
import type { Tables } from "@/lib/types/supabase";
import { cn } from "@/lib/utils";

type BusinessWithUsers = Tables<"businesses"> & {
  business_users: Tables<"business_users">[];
};

export default function BusinessSettingsPage() {
  const [businesses, setBusinesses] = useState<BusinessWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessWithUsers | null>(null);
  const [deletingBusiness, setDeletingBusiness] = useState<BusinessWithUsers | null>(null);
  const { setHasBusiness, selectedBusinessId } = useBusinessContext();
  const router = useRouter();

  const addForm = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await BusinessService.getBusinesses();
        setBusinesses(data as BusinessWithUsers[]);
      } catch {
        toast.error("İşletmeler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (editingBusiness) {
      editForm.reset({ name: editingBusiness.name });
    }
  }, [editingBusiness, editForm]);

  const onSubmit = async (values: BusinessFormValues) => {
    try {
      await BusinessService.createBusiness(values);
      addForm.reset();
      const data = await BusinessService.getBusinesses();
      setBusinesses(data as BusinessWithUsers[]);
      setHasBusiness(true);
      toast.success("İşletme oluşturuldu.");
      setAddOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "İşletme oluşturulurken bir hata oluştu.",
      );
    }
  };

  const handleEdit = async (values: BusinessFormValues) => {
    try {
      if (!editingBusiness) return;
      await BusinessService.updateBusiness(editingBusiness.id, values);
      const data = await BusinessService.getBusinesses();
      setBusinesses(data as BusinessWithUsers[]);
      setEditingBusiness(null);
      editForm.reset();
      toast.success("İşletme güncellendi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Güncelleme başarısız.");
    }
  };

  const handleDelete = async () => {
    try {
      if (!deletingBusiness) return;
      await BusinessService.deleteBusiness(deletingBusiness.id);
      const next = businesses.filter((business) => business.id !== deletingBusiness.id);
      setBusinesses(next);
      if (next.length === 0) setHasBusiness(false);
      setDeletingBusiness(null);
      toast.success("İşletme silindi.");
    } catch {
      toast.error("İşletme silinirken bir hata oluştu.");
    }
  };

  return (
    <div>
      <PageHeader
        title="İşletmeler"
        description="İşletme kayıtlarınızı yönetin. Aktif çalışma alanını kenar çubuğundan seçebilirsiniz."
        meta={
          <span className="inline-flex items-center gap-1.5">
            <HugeIcon icon={Building03Icon} size={14} />
            {businesses.length > 0 ? `${businesses.length} kayıt` : "Henüz işletme yok"}
          </span>
        }
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <HugeIcon icon={Add01Icon} size={16} />
                Yeni işletme
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Yeni işletme</DialogTitle>
                <DialogDescription>
                  Menü ve QR yayını için bir işletme kaydı oluşturun.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İşletme adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: Cafe Istanbul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                      İptal
                    </Button>
                    <Button type="submit">Oluştur</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">Yükleniyor...</div>
      ) : businesses.length === 0 ? (
        <EmptyState
          title="Henüz işletme yok"
          description="İlk işletmenizi oluşturduktan sonra menü ve QR yönetimi açılır."
          icon={Building03Icon}
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <HugeIcon icon={Add01Icon} size={16} />
              İşletme oluştur
            </Button>
          }
        />
      ) : (
        <ul className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {businesses.map((business) => {
            const isActive = business.id === selectedBusinessId;
            return (
              <li
                key={business.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
                      isActive && "bg-primary/10 text-primary",
                    )}
                  >
                    <HugeIcon icon={Building03Icon} size={18} />
                  </span>
                  <EntityStack
                    title={
                      <span className="inline-flex items-center gap-2">
                        {business.name}
                        {isActive ? (
                          <StatusBadge tone="success">Seçili</StatusBadge>
                        ) : null}
                      </span>
                    }
                    subtitle={
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-[11px]">/{business.slug}</span>
                        <span>·</span>
                        <span>{business.business_users[0]?.role ?? "Yönetici"}</span>
                      </span>
                    }
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="iconMd"
                    onClick={() => setEditingBusiness(business)}
                    aria-label={`${business.name} düzenle`}
                  >
                    <HugeIcon icon={PencilEdit01Icon} size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconMd"
                    onClick={() => setDeletingBusiness(business)}
                    aria-label={`${business.name} sil`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <HugeIcon icon={Delete02Icon} size={16} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editingBusiness} onOpenChange={() => setEditingBusiness(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>İşletme bilgilerini düzenle</DialogTitle>
            <DialogDescription>İşletmenin gösterilen adını güncelleyin.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İşletme adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingBusiness(null)}>
                  İptal
                </Button>
                <Button type="submit">Güncelle</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBusiness} onOpenChange={() => setDeletingBusiness(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşletmeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. İşletmeyle birlikte tüm menüler, kategoriler, ürünler,
              fiyatlar, görseller ve QR kayıtları kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              İşletmeyi sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
