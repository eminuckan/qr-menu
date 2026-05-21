"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Add01Icon,
  ArrowDataTransferHorizontalIcon,
  Building03Icon,
  DragDropVerticalIcon,
  RefreshIcon,
  Search01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableItem } from "@/components/ui/sortable-item";
import { Switch } from "@/components/ui/switch";
import {
  EmptyState,
  EntityStack,
  PageHeader,
  Toolbar,
} from "@/components/ui/console-primitives";
import { createClient } from "@/lib/supabase/client";
import { useBusinessContext } from "@/lib/contexts/business-context";
import {
  ImportContext,
  ImportRateLimitError,
  ImportService,
  type ImportProgress,
} from "@/lib/services/import-service";
import type { Database } from "@/lib/types/supabase";
import { cn } from "@/lib/utils";

type Menu = Database["public"]["Tables"]["menus"]["Row"] & {
  businesses: Pick<Database["public"]["Tables"]["businesses"]["Row"], "id" | "name">;
};

type Business = Pick<Database["public"]["Tables"]["businesses"]["Row"], "id" | "name">;

type MenuFormValues = {
  name: string;
};

const menuFormSchema = z.object({
  name: z
    .string()
    .min(2, "Menü adı en az 2 karakter olmalıdır")
    .max(50, "Menü adı en fazla 50 karakter olabilir"),
});

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
};

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const Page = () => {
  const supabase = createClient();
  const {
    hasBusiness,
    businesses: scopedBusinesses,
    selectedBusinessId: globalSelectedBusinessId,
  } = useBusinessContext();

  const [mounted, setMounted] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [addOpen, setAddOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    currentCategory: string;
    currentProduct: string;
    stats: ImportProgress["stats"];
  } | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const importContextRef = useRef<ImportContext>({
    menuId: null,
    categoryIds: [],
    aborted: false,
    paused: false,
  });

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: { name: "" },
  });

  const fetchMenus = useCallback(async () => {
    try {
      const options = scopedBusinesses.map((business) => ({
        id: business.id,
        name: business.name,
      }));
      setBusinesses(options);
      if (!globalSelectedBusinessId) {
        setMenus([]);
        return;
      }
      const { data, error } = await supabase
        .from("menus")
        .select("*, businesses(id, name)")
        .eq("business_id", globalSelectedBusinessId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setMenus((data ?? []) as Menu[]);
    } catch {
      toast.error("Veriler yüklenirken bir hata oluştu.");
    }
  }, [globalSelectedBusinessId, scopedBusinesses, supabase]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) void fetchMenus();
  }, [mounted, fetchMenus]);


  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem("importRateLimit");
      if (!stored) return;
      const { timestamp, duration } = JSON.parse(stored);
      const elapsed = Math.floor((Date.now() - timestamp) / 1000);
      const remaining = duration - elapsed;
      if (remaining > 0) {
        setIsRateLimited(true);
        setRateLimitCountdown(remaining);
      } else {
        localStorage.removeItem("importRateLimit");
        setIsRateLimited(false);
        setRateLimitCountdown(0);
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem("importRateLimit");
          setIsRateLimited(false);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = menus.findIndex((item) => item.id === active.id);
    const newIndex = menus.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(menus, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    setMenus(reordered);
    try {
      const updates = reordered.map(({ id, sort_order, name, business_id }) => ({
        id,
        sort_order,
        name,
        business_id,
      }));
      const { error } = await supabase.from("menus").upsert(updates, { onConflict: "id" }).select();
      if (error) throw error;
      toast.success("Menü sıralaması güncellendi.");
    } catch {
      toast.error("Sıralama güncellenirken bir hata oluştu.");
    }
  };

  const handleAdd = async (values: MenuFormValues) => {
    if (!globalSelectedBusinessId) {
      toast.error("Önce bir işletme seçin.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("menus")
        .insert({
          name: values.name,
          business_id: globalSelectedBusinessId,
          is_active: true,
          sort_order: menus.length + 1,
        })
        .select("*, businesses(id, name)")
        .single();
      if (error) throw error;
      if (data) {
        setMenus((prev) => [...prev, data as Menu]);
        toast.success("Menü eklendi.");
        form.reset();
        setAddOpen(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Menü eklenemedi.");
    }
  };

  const handleActiveChange = async (id: string, checked: boolean) => {
    try {
      const { error } = await supabase.from("menus").update({ is_active: checked }).eq("id", id);
      if (error) throw error;
      setMenus((prev) =>
        prev.map((menu) => (menu.id === id ? { ...menu, is_active: checked } : menu)),
      );
      toast.success("Menü durumu güncellendi.");
    } catch {
      toast.error("Menü durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleMove = async (menuId: string, newBusinessId: string) => {
    try {
      const { error } = await supabase
        .from("menus")
        .update({ business_id: newBusinessId })
        .eq("id", menuId);
      if (error) throw error;
      const target = businesses.find((business) => business.id === newBusinessId);
      setMenus((prev) =>
        prev.map((menu) =>
          menu.id === menuId
            ? {
                ...menu,
                business_id: newBusinessId,
                businesses: {
                  id: newBusinessId,
                  name: target?.name || menu.businesses.name,
                },
              }
            : menu,
        ),
      );
      toast.success(`Menü ${target?.name ?? "yeni işletme"} altına taşındı.`);
      setMoveMenuId(null);
    } catch {
      toast.error("Menü taşınırken bir hata oluştu.");
    }
  };

  const handleImport = async () => {
    if (!globalSelectedBusinessId) {
      toast.error("Önce bir işletme seçin.");
      return;
    }
    setImporting(true);
    setShowImportConfirm(false);
    try {
      const context: ImportContext = {
        menuId: null,
        categoryIds: [],
        aborted: false,
        paused: false,
      };
      importContextRef.current = context;
      const result = await ImportService.importMenuFromAdisyo(
        context,
        globalSelectedBusinessId,
        (progress) => setImportProgress(progress),
      );
      await fetchMenus();
      toast.success(
        `${result.stats.importedCategories} yeni / ${result.stats.updatedCategories} güncel kategori · ${result.stats.importedProducts} yeni / ${result.stats.updatedProducts} güncel ürün`,
      );
    } catch (error) {
      if (error instanceof ImportRateLimitError) {
        setIsRateLimited(true);
        setRateLimitCountdown(error.retryAfterSeconds);
        localStorage.setItem(
          "importRateLimit",
          JSON.stringify({ timestamp: Date.now(), duration: error.retryAfterSeconds }),
        );
      }
      toast.error(error instanceof Error ? error.message : "Menü aktarılırken bir hata oluştu.");
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleAbortConfirm = async () => {
    try {
      importContextRef.current.aborted = true;
      ImportService.abortImport(importContextRef.current);
      if (importContextRef.current.menuId) {
        await ImportService.cleanup(importContextRef.current);
      }
      setShowAbortDialog(false);
      setImporting(false);
      setImportProgress(null);
      toast.success("İçe aktarma iptal edildi.");
    } catch {
      toast.error("İptal sırasında bir hata oluştu.");
    }
  };

  if (!mounted) {
    return null;
  }

  const filteredMenus = menus.filter((menu) => {
    if (statusFilter === "active" && !menu.is_active) return false;
    if (statusFilter === "inactive" && menu.is_active) return false;
    if (search && !normalize(menu.name).includes(normalize(search))) return false;
    return true;
  });

  const activeMenus = menus.filter((menu) => menu.is_active).length;

  return (
    <div>
      <PageHeader
        title="Menü yönetimi"
        description="Menüleri işletmeye göre sıralayın, yayına alın ve içerik detayına geçin."
        meta={
          <>
            <span>{menus.length} toplam</span>
            <span>{activeMenus} aktif</span>
            {scopedBusinesses.length ? <span>{scopedBusinesses.length} işletme</span> : null}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportConfirm(true)}
              disabled={isRateLimited || importing || !hasBusiness || !globalSelectedBusinessId}
              title={!globalSelectedBusinessId ? "Önce bir işletme seçin" : undefined}
            >
              <HugeIcon
                icon={RefreshIcon}
                size={16}
                className={cn(importing && "animate-spin")}
              />
              {isRateLimited ? formatCountdown(rateLimitCountdown) : "Adisyo aktar"}
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <HugeIcon icon={Add01Icon} size={16} />
                  Yeni menü
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Yeni menü</DialogTitle>
                  <DialogDescription>
                    Menüyü oluşturduktan sonra kategori ve ürün ekleyebilirsiniz.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAdd)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Menü adı</FormLabel>
                          <FormControl>
                            <Input placeholder="Örn: Yaz menüsü" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit">Ekle</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Toolbar className="mt-1">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <HugeIcon
              icon={Search01Icon}
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Menü ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Toolbar>

      {!globalSelectedBusinessId ? (
        <EmptyState
          title="İşletme seçilmemiş"
          description="Menüleri görmek için kenar çubuğundaki işletme seçicisinden bir işletme seçin."
          icon={Building03Icon}
        />
      ) : filteredMenus.length === 0 ? (
        <EmptyState
          title={menus.length === 0 ? "Henüz menü yok" : "Sonuç bulunamadı"}
          description={
            menus.length === 0
              ? "Yeni menü oluşturarak ilk yayını başlatın."
              : "Arama veya filtre kriterlerine uygun menü bulunmuyor."
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={menus} strategy={verticalListSortingStrategy}>
            <ul className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {filteredMenus.map((menu, index) => (
                <li
                  key={menu.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto_auto] sm:gap-4 sm:px-4"
                >
                  <SortableItem id={menu.id}>
                    <button
                      type="button"
                      className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted active:cursor-grabbing"
                      aria-label="Sırala"
                    >
                      <HugeIcon icon={DragDropVerticalIcon} size={16} />
                    </button>
                  </SortableItem>
                  <span className="hidden font-mono text-xs text-muted-foreground/70 sm:inline">
                    #{String(index + 1).padStart(2, "0")}
                  </span>
                  <EntityStack
                    title={menu.name}
                    subtitle={
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            menu.is_active ? "bg-success" : "bg-muted-foreground/60",
                          )}
                        />
                        {menu.is_active ? "Yayında" : "Taslak"}
                      </span>
                    }
                  />
                  <label className="hidden cursor-pointer items-center gap-2 text-xs text-muted-foreground sm:flex">
                    <Switch
                      checked={menu.is_active ?? false}
                      onCheckedChange={(checked) => handleActiveChange(menu.id, checked)}
                    />
                    <span>{menu.is_active ? "Aktif" : "Pasif"}</span>
                  </label>
                  {scopedBusinesses.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMoveMenuId(menu.id)}
                      className="hidden sm:inline-flex"
                    >
                      <HugeIcon icon={ArrowDataTransferHorizontalIcon} size={16} />
                      <span className="hidden md:inline">Taşı</span>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/menu/${menu.id}`}>
                      <HugeIcon icon={ViewIcon} size={16} />
                      <span className="hidden sm:inline">İncele</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={importing} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Menü aktarılıyor</DialogTitle>
            <DialogDescription>
              İşlem tamamlanana kadar lütfen bekleyin. İstediğiniz zaman iptal edebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <LoadingSpinner />
            {importProgress ? (
              <div className="space-y-2 rounded-md border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">Kategori: {importProgress.currentCategory}</p>
                {importProgress.currentProduct ? (
                  <p className="text-sm font-medium">Ürün: {importProgress.currentProduct}</p>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Kategoriler</div>
                    <div className="text-base font-semibold">
                      {importProgress.stats.importedCategories}/{importProgress.stats.totalCategories}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Ürünler</div>
                    <div className="text-base font-semibold">
                      {importProgress.stats.importedProducts}/{importProgress.stats.totalProducts}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <Button variant="outline" className="w-full" onClick={() => setShowAbortDialog(true)}>
              İçe aktarmayı iptal et
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İçe aktarmayı iptal et</AlertDialogTitle>
            <AlertDialogDescription>
              İptal ettiğinizde şu ana kadar aktarılan veriler silinecek. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Devam et</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbortConfirm}>İptal et</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!moveMenuId} onOpenChange={() => setMoveMenuId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Menüyü taşı</DialogTitle>
            <DialogDescription>
              Menüyü hangi işletmeye taşımak istediğinizi seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label>Hedef işletme</Label>
            <Select
              onValueChange={(businessId) =>
                moveMenuId ? void handleMove(moveMenuId, businessId) : null
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="İşletme seçin" />
              </SelectTrigger>
              <SelectContent>
                {businesses
                  .filter(
                    (business) => business.id !== menus.find((menu) => menu.id === moveMenuId)?.business_id,
                  )
                  .map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adisyo&apos;dan içe aktar</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Aktif işletme için Adisyo menüsünü içe aktarıyorsunuz. Mevcut menüye yeni kayıtlar
                eklenecek ve eşleşen kayıtlar güncellenecek.
              </span>
              {scopedBusinesses.find((business) => business.id === globalSelectedBusinessId)?.name ? (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  <HugeIcon icon={Building03Icon} size={12} />
                  {scopedBusinesses.find((business) => business.id === globalSelectedBusinessId)?.name}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleImport()}>İçe aktar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Page;
