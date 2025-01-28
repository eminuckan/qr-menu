"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/sortable-item";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Eye, Plus, RefreshCw, Building2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { ImportService, ImportContext } from "@/lib/services/import-service";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBusinessContext } from '@/lib/contexts/business-context';
import { Database } from '@/lib/types/supabase';
import toast from "react-hot-toast";

type Menu = Database['public']['Tables']['menus']['Row'] & {
  businesses: Pick<Database['public']['Tables']['businesses']['Row'], 'id' | 'name'>;
};

type Business = Pick<Database['public']['Tables']['businesses']['Row'], 'id' | 'name'>;

type MenuFormValues = {
  name: string;
  business_id: string;
};

const menuFormSchema = z.object({
  name: z
    .string()
    .min(2, "Menü adı en az 2 karakter olmalıdır")
    .max(50, "Menü adı en fazla 50 karakter olabilir"),
  business_id: z
    .string()
    .min(1, "İşletme seçmelisiniz")
});

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Menüleri işletmelere göre gruplamak için helper fonksiyon
const groupMenusByBusiness = (menus: Menu[]) => {
  return menus.reduce((groups, menu) => {
    if (!menu.businesses) return groups;

    const businessId = menu.businesses.id;
    if (!groups[businessId]) {
      groups[businessId] = {
        businessName: menu.businesses.name,
        menus: []
      };
    }
    groups[businessId].menus.push(menu);
    return groups;
  }, {} as Record<string, { businessName: string; menus: Menu[] }>);
};

const Page = () => {
  const [mounted, setMounted] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    currentCategory: string;
    currentProduct: string;
    stats: any;
  } | null>(null);
  const [importContext, setImportContext] = useState<ImportContext>({
    menuId: null,
    categoryIds: [],
    aborted: false,
    paused: false
  });
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const supabase = createClient();
  const { hasBusiness } = useBusinessContext();

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const getMenus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select(`
          *,
          businesses (
            id,
            name
          )
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setMenus(data as Menu[] || []);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name');

      if (businessError) throw businessError;

      setBusinesses(businessData || []);
    } catch (error) {
      toast.error("Veriler yüklenirken bir hata oluştu.");
    }
  }, [supabase]);

  const handleAddMenu = async (values: MenuFormValues) => {
    try {
      const { data: newMenu, error } = await supabase
        .from('menus')
        .insert({
          name: values.name,
          business_id: values.business_id,
          is_active: true as boolean | null,
          sort_order: menus.length + 1
        })
        .select('*, businesses(id, name)')
        .single();

      if (error) throw error;

      if (newMenu) {
        setMenus(prev => [...prev, {
          ...newMenu,
          businesses: newMenu.businesses as Pick<Database['public']['Tables']['businesses']['Row'], 'id' | 'name'>
        }]);

        toast.success("Menü başarıyla eklendi.");
        form.reset();
        setOpen(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Menü eklenirken bir hata oluştu.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setMenus((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: index + 1,
        }));

        const updateDatabase = async () => {
          const updates = updatedItems.map(({ id, sort_order, name, business_id }) => ({
            id,
            sort_order,
            name,
            business_id
          }));

          const { error } = await supabase
            .from("menus")
            .upsert(updates, { onConflict: 'id' })
            .select();

          if (error) {
            toast.error("Menü sıralaması güncellenirken bir hata oluştu.");
            return;
          }

          toast.success("Menü sıralaması güncellendi.");
        };

        updateDatabase();
        return updatedItems;
      });
    }
  };

  const handleActiveChange = async (id: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from("menus")
        .update({ is_active: checked })
        .eq("id", id);

      if (error) throw error;

      setMenus((prevItems) =>
        prevItems.map((menuItem) =>
          menuItem.id === id
            ? { ...menuItem, is_active: checked }
            : menuItem
        )
      );

      toast.success("Menü durumu güncellendi.");
    } catch (error) {
      toast.error("Menü durumu güncellenirken bir hata oluştu.");
    }
  };

  const handleBusinessChange = async (menuId: string, businessId: string) => {
    try {
      const { error } = await supabase
        .from('menus')
        .update({ business_id: businessId })
        .eq('id', menuId);

      if (error) throw error;

      // State'i güncelle
      setMenus(prev => prev.map(menu =>
        menu.id === menuId
          ? {
            ...menu,
            business_id: businessId,
            businesses: businesses.find(b => b.id === businessId) || menu.businesses
          }
          : menu
      ));

      toast.success("Menü başarıyla taşındı.");
    } catch (error) {
      console.error('Error updating menu:', error);
      toast.error("Menü taşınırken bir hata oluştu.");
    }
  };

  const handleImport = async () => {
    if (!hasBusiness) {
      toast.error("Menü içe aktarma için en az bir işletme kaydının olması gerekiyor.");
      return;
    }

    if (!selectedBusinessId) {
      toast.error("Lütfen bir işletme seçin.");
      return;
    }

    setImporting(true);
    setShowImportDialog(false);

    try {
      // Import context'i oluştur
      const importContext: ImportContext = {
        menuId: null,
        categoryIds: [],
        aborted: false,
        paused: false
      };

      // Import işlemini başlat
      const result = await ImportService.importMenuFromAdisyo(
        importContext,
        selectedBusinessId,
        (progress) => {
          setImportProgress(progress);
        }
      );

      // Başarılı import sonrası menüleri yeniden yükle
      await getMenus();

      toast.success(`${result.stats.importedCategories} yeni kategori, ${result.stats.updatedCategories} güncellenen kategori\n${result.stats.importedProducts} yeni ürün, ${result.stats.updatedProducts} güncellenen ürün\n${result.stats.updatedPrices} fiyat güncellendi${result.stats.failedItems.categories.length > 0 || result.stats.failedItems.products.length > 0
        ? "\n\nBazı öğeler aktarılamadı."
        : ""
        }`);

    } catch (error) {
      console.error('Import hatası:', error);

      let errorMessage = "Menü aktarılırken bir hata oluştu";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Rate limit kontrolü
        if (error.message.includes('rate limit')) {
          setIsRateLimited(true);
          const duration = 180; // 3 dakika
          setRateLimitCountdown(duration);

          // Rate limit bilgisini localStorage'a kaydet
          localStorage.setItem('importRateLimit', JSON.stringify({
            timestamp: Date.now(),
            duration: duration
          }));

          console.log('Rate limit başlatıldı:', duration, 'saniye');
        }
      }

      toast.error(errorMessage);
    } finally {
      setImporting(false);
      setImportProgress(null);
      setSelectedBusinessId(null);
    }
  };

  const handleAbort = () => {
    setShowAbortDialog(true);
    setIsPaused(true);
  };

  const handleAbortConfirm = async () => {
    try {
      // Import context'i güncelle
      setImportContext(prev => ({ ...prev, aborted: true }));
      setShowAbortDialog(false);
      setIsPaused(false);

      // ImportService'e iptal sinyali gönder
      ImportService.abortImport(importContext);

      // Temizlik işlemleri
      if (importContext.menuId) {
        await ImportService.cleanup(importContext);
      }

      // State'leri sıfırla
      setImporting(false);
      setImportProgress(null);
      setImportContext({
        menuId: null,
        categoryIds: [],
        aborted: false,
        paused: false
      });

      toast.success("İşlem başarıyla iptal edildi.");
    } catch (error) {
      console.error("İptal işlemi sırasında hata:", error);
      toast.error("İptal işlemi sırasında bir hata oluştu.");
    }
  };

  const handleAbortCancel = () => {
    setShowAbortDialog(false);
    setIsPaused(false);
  };

  const handleMoveMenu = async (menuId: string, newBusinessId: string) => {
    try {
      const { error } = await supabase
        .from('menus')
        .update({ business_id: newBusinessId })
        .eq('id', menuId);

      if (error) throw error;

      const targetBusiness = businesses.find(b => b.id === newBusinessId);

      setMenus(prev => prev.map(menu =>
        menu.id === menuId
          ? {
            ...menu,
            business_id: newBusinessId,
            businesses: {
              id: newBusinessId,
              name: targetBusiness?.name || menu.businesses.name
            }
          }
          : menu
      ));

      toast.success(`Menü başarıyla ${targetBusiness?.name} işletmesine taşındı.`);
      setMoveMenuId(null);
    } catch (error) {
      toast.error("Menü taşınırken bir hata oluştu.");
    }
  };

  // Rate limit kontrolü
  useEffect(() => {
    const checkRateLimit = () => {
      const storedLimit = localStorage.getItem('importRateLimit');
      if (storedLimit) {
        const { timestamp, duration } = JSON.parse(storedLimit);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - timestamp) / 1000);
        const remainingSeconds = duration - elapsedSeconds;

        if (remainingSeconds > 0) {
          setIsRateLimited(true);
          setRateLimitCountdown(remainingSeconds);
          console.log('Rate limit aktif:', remainingSeconds, 'saniye kaldı');
        } else {
          localStorage.removeItem('importRateLimit');
          setIsRateLimited(false);
          setRateLimitCountdown(0);
          console.log('Rate limit süresi doldu');
        }
      }
    };

    // Sayfa yüklendiğinde kontrol et
    checkRateLimit();

    // Her saniye kontrol et
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rate limit sayacı
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setInterval(() => {
        setRateLimitCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            localStorage.removeItem('importRateLimit');
            setIsRateLimited(false);
            return 0;
          }
          return newCount;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [rateLimitCountdown]);

  useEffect(() => {
    setImportContext(prev => ({ ...prev, paused: isPaused }));
  }, [isPaused]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      getMenus();
    }
  }, [mounted, getMenus]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menü Yönetimi</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowImportDialog(true)}
              disabled={isRateLimited || importing || !hasBusiness}
              title={!hasBusiness ? "Menü içe aktarma için en az bir işletme kaydının olması gerekiyor" : ""}
            >
              <RefreshCw
                className={cn("h-5 w-5", {
                  "animate-spin": importing,
                })}
              />
              {isRateLimited ? (
                <span className="flex items-center gap-2">
                  <span>Lütfen bekleyin</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {formatCountdown(rateLimitCountdown)}
                  </span>
                </span>
              ) : (
                "Adisyodan Menü Getir"
              )}
            </Button>
            {!hasBusiness && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-muted-foreground">
                  İşletme kaydı gerekiyor
                </span>
              </div>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Yeni Menü Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="space-y-3 pb-4">
                <DialogTitle className="text-xl">Yeni Menü Ekle</DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Menüyü oluşturduktan sonra içeriğini düzenleyebilir ve
                  özelleştirebilirsiniz.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddMenu)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Menü Adı</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Menü adını giriniz"
                            className="text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="business_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İşletme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="İşletme seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businesses.map((business) => (
                              <SelectItem key={business.id} value={business.id}>
                                {business.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full text-base">
                    Ekle
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={menus}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-8">
            {Object.entries(groupMenusByBusiness(menus)).map(([businessId, { businessName, menus: businessMenus }]) => (
              <div key={businessId} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">{businessName}</h3>
                </div>
                <div className="space-y-2 pl-7">
                  {businessMenus.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <SortableItem id={item.id}>
                        <div className="flex items-center gap-3 flex-1 cursor-grab">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-400 font-medium text-sm">
                            #{String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </SortableItem>
                      <div className="flex items-center gap-4 pl-4 border-l">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active ?? false}
                            onCheckedChange={(checked) => handleActiveChange(item.id, checked)}
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            {item.is_active ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                        <Link href={`/dashboard/menu/${item.id}`}>
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <span>
                              <Eye className="h-4 w-4" />
                              İncele
                            </span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setMoveMenuId(item.id)}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Taşı
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={importing} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-4 pb-6">
            <DialogTitle className="text-xl">Menü Aktarılıyor</DialogTitle>
            <DialogDescription className="text-base">
              Lütfen işlem tamamlanana kadar bekleyin. İptal etmek için aşağıdaki butonu kullanabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <LoadingSpinner />
            {importProgress && (
              <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Kategori: {importProgress.currentCategory}
                  </p>
                  {importProgress.currentProduct && (
                    <p className="text-sm font-medium">
                      Ürün: {importProgress.currentProduct}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background rounded p-3">
                    <p className="text-sm text-muted-foreground mb-1">Kategoriler</p>
                    <p className="text-lg font-semibold">
                      {importProgress.stats.importedCategories}/{importProgress.stats.totalCategories}
                    </p>
                  </div>
                  <div className="bg-background rounded p-3">
                    <p className="text-sm text-muted-foreground mb-1">Ürünler</p>
                    <p className="text-lg font-semibold">
                      {importProgress.stats.importedProducts}/{importProgress.stats.totalProducts}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAbort}
            >
              İçe Aktarmayı İptal Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İçe Aktarmayı İptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              İçe aktarma işlemini iptal etmek istediğinize emin misiniz?
              Bu işlem geri alınamaz ve şu ana kadar aktarılan veriler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAbortCancel}>
              Devam Et
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAbortConfirm}>
              İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!moveMenuId} onOpenChange={() => setMoveMenuId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Menüyü Taşı</DialogTitle>
            <DialogDescription>
              Menüyü taşımak istediğiniz işletmeyi seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select
              onValueChange={(businessId) => moveMenuId && handleMoveMenu(moveMenuId, businessId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="İşletme seçin" />
              </SelectTrigger>
              <SelectContent>
                {businesses
                  .filter(b => b.id !== menus.find(m => m.id === moveMenuId)?.business_id)
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

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Menü İçe Aktarma</DialogTitle>
            <DialogDescription>
              Adisyo'dan içe aktarılacak menünün hangi işletmeye ait olacağını seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>İşletme</Label>
              <Select
                onValueChange={(value) => setSelectedBusinessId(value)}
                value={selectedBusinessId || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İşletme seçin" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedBusinessId}
            >
              İçe Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
