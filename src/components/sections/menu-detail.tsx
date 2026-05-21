"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  AddCircleIcon,
  Delete02Icon,
  ArrowRight01Icon,
  DragDropVerticalIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
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
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  Toolbar,
} from "@/components/ui/console-primitives";
import { MenuService } from "@/lib/services/menu-service";
import type { Database } from "@/lib/types/supabase";
import { cn } from "@/lib/utils";

type Tables = Database["public"]["Tables"];
type Menu = Tables["menus"]["Row"];
type Category = Tables["categories"]["Row"] & {
  products: Array<Pick<Tables["products"]["Row"], "id" | "name" | "is_active">>;
};

interface MenuDetailProps {
  id: string;
}

interface CategoryFormData {
  name: string;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

const CategoryRow = ({
  category,
  index,
  onActiveChange,
}: {
  category: Category;
  index: number;
  onActiveChange: (id: string, checked: boolean) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: isDragging ? "var(--card)" : undefined,
    zIndex: isDragging ? 1 : undefined,
  };

  const activeProducts = category.products?.filter((product) => product.is_active === true).length ?? 0;
  const totalProducts = category.products?.length ?? 0;
  const hasImage = Boolean(category.cover_image);
  const isEmpty = totalProducts === 0;

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="group relative">
      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)_minmax(140px,180px)_auto_auto] sm:gap-4 sm:px-4 sm:py-3">
        <button
          type="button"
          {...listeners}
          className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground/50 transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Sırala"
        >
          <HugeIcon icon={DragDropVerticalIcon} size={14} />
        </button>

        <span className="hidden w-8 font-mono text-xs tabular-nums text-muted-foreground/60 sm:inline">
          {String(index + 1).padStart(2, "0")}
        </span>

        {hasImage ? (
          <div
            className="size-9 shrink-0 overflow-hidden rounded-md bg-cover bg-center sm:size-10"
            style={{ backgroundImage: `url(${category.cover_image})` }}
            aria-hidden="true"
          />
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase text-muted-foreground/70 sm:size-10"
            aria-hidden="true"
          >
            {category.name.slice(0, 2)}
          </div>
        )}

        <Link
          href={`/dashboard/menu/category/${category.id}`}
          className="min-w-0 outline-none focus-visible:underline"
        >
          <span className="block truncate text-[15px] font-semibold leading-tight">{category.name}</span>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
            <span
              className={cn(
                "size-1.5 rounded-full",
                category.is_active ? "bg-success" : "bg-muted-foreground/40",
              )}
            />
            {activeProducts}/{totalProducts} ürün
          </span>
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="min-w-[120px]">
            <ProductsBar active={activeProducts} total={totalProducts} />
          </div>
          {isEmpty ? (
            <span className="hidden whitespace-nowrap rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warning-foreground lg:inline">
              Boş
            </span>
          ) : null}
        </div>

        <Switch
          checked={category.is_active === true}
          onCheckedChange={(checked) => onActiveChange(category.id, checked)}
          className="shrink-0"
          aria-label={category.is_active ? "Pasifleştir" : "Yayına al"}
        />

        <Button asChild variant="ghost" size="iconMd" className="shrink-0">
          <Link href={`/dashboard/menu/category/${category.id}`} aria-label={`${category.name} kategorisini aç`}>
            <HugeIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </Button>
      </div>
    </li>
  );
};

function ProductsBar({ active, total }: { active: number; total: number }) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            active > 0 ? "bg-success" : "bg-muted-foreground/30",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
        <span className="font-semibold text-foreground">{active}</span>
        <span className="text-muted-foreground">/{total}</span>
      </span>
    </div>
  );
}

export function MenuDetail({ id }: MenuDetailProps) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const form = useForm<CategoryFormData>();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, categoriesData] = await Promise.all([
          MenuService.getMenu(id),
          MenuService.getCategories(id),
        ]);
        setMenu(menuData);
        setCategories(categoriesData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const maxSortOrder = categories.reduce(
        (max, category) => Math.max(max, category.sort_order || 0),
        0,
      );
      const newCategory = await MenuService.addCategory({
        name: data.name,
        menu_id: id,
        is_active: true,
        sort_order: maxSortOrder + 1,
        color: "#ffffff",
      });
      setCategories((prev) => [...prev, { ...newCategory, products: [] }]);
      toast.success("Kategori eklendi");
      setIsOpen(false);
      form.reset();
    } catch {
      toast.error("Kategori eklenirken bir hata oluştu");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updated = newItems.map((item, index) => ({ ...item, sort_order: index + 1 }));
        void (async () => {
          try {
            await MenuService.updateCategoryOrder(
              updated.map((item) => ({
                id: item.id,
                sort_order: item.sort_order,
                menu_id: item.menu_id,
                name: item.name,
                is_active: item.is_active === true,
                color: item.color || "#ffffff",
              })),
            );
            toast.success("Sıralama güncellendi");
          } catch {
            toast.error("Sıralama güncellenirken bir hata oluştu");
          }
        })();
        return updated;
      });
    }
  };

  const handleDragCancel = () => setActiveId(null);

  const handleActiveChange = async (categoryId: string, checked: boolean) => {
    try {
      await MenuService.updateCategoryStatus(categoryId, checked);
      setCategories((prev) =>
        prev.map((item) => (item.id === categoryId ? { ...item, is_active: checked } : item)),
      );
      toast.success("Kategori durumu güncellendi");
    } catch {
      toast.error("Kategori durumu güncellenirken bir hata oluştu");
    }
  };

  const handleNameChange = async (newName: string) => {
    if (!newName.trim()) {
      toast.error("Menü adı boş olamaz");
      return;
    }
    try {
      await MenuService.updateMenu(id, { name: newName.trim() });
      setMenu((prev) => (prev ? { ...prev, name: newName.trim() } : null));
      toast.success("Menü adı güncellendi");
    } catch {
      toast.error("Menü adı güncellenirken bir hata oluştu");
    }
  };

  const handleDelete = async () => {
    try {
      await MenuService.deleteMenu(id);
      toast.success("Menü silindi");
      router.push("/dashboard/menu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Menü silinirken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (error || !menu) {
    notFound();
  }

  const filtered = categories.filter((category) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? category.is_active === true
          : category.is_active !== true;
    if (!matchesStatus) return false;
    if (searchTerm) {
      return normalize(category.name).includes(normalize(searchTerm));
    }
    return true;
  });

  const totalProducts = categories.reduce((sum, category) => sum + (category.products?.length ?? 0), 0);
  const activeProducts = categories.reduce(
    (sum, category) => sum + (category.products?.filter((product) => product.is_active).length ?? 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title={menu.name}
        backHref="/dashboard/menu"
        editable
        onTitleChange={handleNameChange}
        description="Menüye bağlı kategorileri sıralayın, yayına alın ve ürünleri yönetin."
        meta={
          <>
            <StatusBadge tone={menu.is_active ? "success" : "neutral"}>
              {menu.is_active ? "Aktif" : "Pasif"}
            </StatusBadge>
            <span>
              <span className="font-medium text-foreground">{categories.length}</span> kategori
            </span>
            <span>
              <span className="font-medium text-foreground">{activeProducts}</span>/{totalProducts} ürün yayında
            </span>
            {totalProducts > 0 ? (
              <span>
                Yayın oranı{" "}
                <span className="font-medium text-foreground">
                  {Math.round((activeProducts / totalProducts) * 100)}%
                </span>
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HugeIcon icon={Delete02Icon} size={16} />
                  Menüyü sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Menüyü sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu menüyle birlikte kategoriler, ürünler, fiyatlar, fotoğraflar, etiketler ve
                    alerjen kayıtları kalıcı olarak silinecek. İşlem geri alınamaz.
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
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <HugeIcon icon={AddCircleIcon} size={16} />
                  Kategori ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Yeni kategori</DialogTitle>
                  <DialogDescription>
                    Menüye eklemek istediğiniz kategorinin adını yazın.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Kategori adı</Label>
                    <Input
                      id="name"
                      placeholder="Örn: Ana yemekler"
                      {...form.register("name", {
                        required: "Kategori adı gereklidir",
                        minLength: { value: 2, message: "En az 2 karakter olmalı" },
                        maxLength: { value: 50, message: "En fazla 50 karakter olabilir" },
                      })}
                    />
                    {form.formState.errors.name ? (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      İptal
                    </Button>
                    <Button type="submit">Ekle</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Toolbar>
        <div className="relative w-full max-w-sm">
          <HugeIcon
            icon={Search01Icon}
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Kategori ara"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kategoriler</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState
          title={categories.length === 0 ? "Henüz kategori yok" : "Sonuç bulunamadı"}
          description={
            categories.length === 0
              ? "“Kategori ekle” butonunu kullanarak menüye ilk kategoriyi ekleyin."
              : "Arama veya filtre kriterlerinize uygun kategori bulunmuyor."
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={filtered} strategy={verticalListSortingStrategy}>
            <ul className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
              {filtered.map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  index={index}
                  onActiveChange={handleActiveChange}
                />
              ))}
            </ul>
          </SortableContext>
          {typeof window !== "undefined"
            ? createPortal(
                <DragOverlay
                  adjustScale
                  dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                  }}
                >
                  {activeId ? (
                    <ul className="overflow-hidden rounded-lg border border-border bg-card shadow-lg ring-1 ring-primary/40">
                      <CategoryRow
                        category={categories.find((category) => category.id === activeId)!}
                        index={categories.findIndex((category) => category.id === activeId)}
                        onActiveChange={handleActiveChange}
                      />
                    </ul>
                  ) : null}
                </DragOverlay>,
                document.body,
              )
            : null}
        </DndContext>
      )}
    </div>
  );
}
