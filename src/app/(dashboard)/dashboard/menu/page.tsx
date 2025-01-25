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
import { GripVertical, Eye, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { notFound } from "next/navigation";
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

interface MenuItem {
  id: string;
  name: string;
  isActive: boolean;
  sort_order: number;
}

const menuFormSchema = z.object({
  name: z
    .string()
    .min(2, "Menü adı en az 2 karakter olmalıdır")
    .max(50, "Menü adı en fazla 50 karakter olabilir"),
});

type MenuFormValues = z.infer<typeof menuFormSchema>;

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Page = () => {
  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuName, setNewMenuName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
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

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const getMenus = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return notFound();
    }

    const formattedMenus: MenuItem[] = data.map((menu) => ({
      id: menu.id,
      name: menu.name,
      isActive: menu.is_active,
      sort_order: menu.sort_order,
    }));

    setMenuItems(formattedMenus);
    setIsLoading(false);
  }, []);

  const handleAddMenu = async (values: MenuFormValues) => {
    const supabase = createClient();

    const newMenu = {
      name: values.name,
      is_active: true,
      sort_order: menuItems.length + 1,
    };

    const { data, error } = await supabase
      .from("menus")
      .insert([newMenu])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü eklenirken bir hata oluştu.",
      });
      return;
    }

    setMenuItems([...menuItems, {
      id: data.id,
      name: data.name,
      isActive: data.is_active,
      sort_order: data.sort_order,
    }]);

    toast({
      title: "Başarılı",
      description: "Menü başarıyla eklendi.",
    });
    form.reset();
    setOpen(false);
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
      setMenuItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: index + 1,
        }));

        const updateDatabase = async () => {
          const supabase = createClient();

          const updates = updatedItems.map((item) => ({
            id: item.id,
            sort_order: item.sort_order,
            is_active: item.isActive,
            name: item.name,
          }));

          const { error } = await supabase
            .from("menus")
            .upsert(updates)
            .select();

          if (error) {
            toast({
              variant: "destructive",
              title: "Hata",
              description: "Menü sıralaması güncellenirken bir hata oluştu.",
            });
            return;
          }

          toast({
            title: "Başarılı",
            description: "Menü sıralaması güncellendi.",
          });
        };

        updateDatabase();
        return updatedItems;
      });
    }
  };

  const handleActiveChange = async (id: string, checked: boolean) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("menus")
      .update({ is_active: checked })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü durumu güncellenirken bir hata oluştu.",
      });
      return;
    }

    setMenuItems((prevItems) =>
      prevItems.map((menuItem) =>
        menuItem.id === id
          ? { ...menuItem, isActive: checked }
          : menuItem
      )
    );

    toast({
      title: "Başarılı",
      description: "Menü durumu güncellendi.",
    });
  };

  const handleImport = async () => {
    setImporting(true);

    // Önce mevcut "Adisyo Menü"yü kontrol et
    const supabase = createClient();
    const { data: existingMenu } = await supabase
      .from('menus')
      .select('*')
      .eq('name', 'Adisyo Menü')
      .single();

    let newMenuId: string | null = null;

    if (!existingMenu) {
      // Yeni menü oluştur
      const { data: newMenu, error: menuError } = await supabase
        .from('menus')
        .insert({
          name: 'Adisyo Menü',
          is_active: true,
          sort_order: menuItems.length + 1,
          color: '#ffffff'
        })
        .select()
        .single();

      if (menuError) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Menü oluşturulurken bir hata oluştu.",
        });
        setImporting(false);
        return;
      }

      // Yeni menüyü listeye ekle
      setMenuItems(prev => [...prev, {
        id: newMenu.id,
        name: newMenu.name,
        isActive: newMenu.is_active,
        sort_order: newMenu.sort_order,
      }]);

      newMenuId = newMenu.id;
    } else {
      newMenuId = existingMenu.id;
    }

    setImportContext({
      menuId: newMenuId,
      categoryIds: [],
      aborted: false,
      paused: false
    });

    try {
      const result = await ImportService.importMenuFromAdisyo(
        { menuId: newMenuId, categoryIds: [], aborted: false, paused: false },
        (progress) => {
          setImportProgress(progress);
        }
      );

      if (result.aborted) {
        // Eğer yeni oluşturulmuş menüyse ve iptal edildiyse listeden kaldır
        if (!existingMenu) {
          setMenuItems(prev => prev.filter(item => item.id !== newMenuId));
        }

        toast({
          title: "İçe Aktarma İptal Edildi",
          description: "Menü içe aktarma işlemi iptal edildi.",
          variant: "default"
        });
        return;
      }

      // Başarılı import mesajı
      toast({
        title: "Menü Aktarımı Başarılı",
        description: `${result.stats.importedCategories}/${result.stats.totalCategories} kategori ve ${result.stats.importedProducts}/${result.stats.totalProducts} ürün aktarıldı.${result.stats.failedItems.categories.length > 0 || result.stats.failedItems.products.length > 0
          ? "\n\nBazı öğeler aktarılamadı."
          : ""
          }`,
        variant: "default"
      });

      // Menüleri yenile
      getMenus();

    } catch (error) {
      // Hata durumunda yeni oluşturulmuş menüyü listeden kaldır
      if (!existingMenu) {
        setMenuItems(prev => prev.filter(item => item.id !== newMenuId));
      }

      if (error instanceof Error && error.message.includes('rate limit')) {
        setIsRateLimited(true);
        const duration = 180; // 3 dakika
        setRateLimitCountdown(duration);

        // Rate limit bilgisini localStorage'a kaydet
        localStorage.setItem('importRateLimit', JSON.stringify({
          timestamp: Date.now(),
          duration: duration
        }));
      }
      let errorMessage = "Menü aktarılırken bir hata oluştu";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Menü Aktarım Hatası",
        description: errorMessage,
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleAbort = () => {
    setShowAbortDialog(true);
    setIsPaused(true);
  };

  const handleAbortConfirm = async () => {
    try {
      setImportContext(prev => ({ ...prev, aborted: true }));
      setShowAbortDialog(false);
      setIsPaused(false);

      // İptal işlemi tamamlanana kadar bekle
      await new Promise(resolve => setTimeout(resolve, 500));

      // İmporting durumunu güncelle
      setImporting(false);

      // İptal sonrası temizlik
      setImportProgress(null);
      setImportContext({
        menuId: null,
        categoryIds: [],
        aborted: false,
        paused: false
      });

      toast({
        title: "İçe Aktarma İptal Edildi",
        description: "İşlem başarıyla iptal edildi.",
        variant: "default"
      });
    } catch (error) {
      console.error("İptal işlemi sırasında hata:", error);
      toast({
        title: "Hata",
        description: "İptal işlemi sırasında bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleAbortCancel = () => {
    setShowAbortDialog(false);
    setIsPaused(false);
  };

  // Rate limit için localStorage kontrolü
  useEffect(() => {
    const checkRateLimit = () => {
      const storedData = localStorage.getItem('importRateLimit');
      if (storedData) {
        const { timestamp, duration } = JSON.parse(storedData);
        const now = Date.now();
        const elapsedTime = Math.floor((now - timestamp) / 1000);
        const remainingTime = duration - elapsedTime;

        if (remainingTime > 0) {
          setIsRateLimited(true);
          setRateLimitCountdown(remainingTime);
        } else {
          // Süre bittiyse localStorage'dan sil
          localStorage.removeItem('importRateLimit');
          setIsRateLimited(false);
          setRateLimitCountdown(0);
        }
      }
    };

    checkRateLimit();
  }, []);

  // Rate limit countdown effect'i
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setInterval(() => {
        setRateLimitCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            // Süre bittiğinde localStorage'dan sil
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
              onClick={handleImport}
              disabled={isRateLimited || importing}
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
            {isRateLimited && (
              <div className="absolute -bottom-6 left-0 right-0 text-center">
                <span className="text-xs text-muted-foreground">
                  API limiti aşıldı
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
          items={menuItems}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {menuItems.map((item, index) => (
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
                      checked={item.isActive}
                      onCheckedChange={(checked) => handleActiveChange(item.id, checked)}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.isActive ? "Aktif" : "Pasif"}
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
    </div>
  );
};

export default Page;
