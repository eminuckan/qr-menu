"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, Menu } from "@/types/database";
import { Button } from "@/components/ui/button";
import { PlusCircle, GripVertical, Eye, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/ui/sortable-item";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import Link from "next/link";

interface MenuDetailProps {
  id: string;
}

interface CategoryFormData {
  name: string;
}

const CategoryCard = ({
  category,
  index,
  onActiveChange,
}: {
  category: Category;
  index: number;
  onActiveChange: (id: string, checked: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={category.cover_image || "/no-image.jpg"}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div {...listeners} className="cursor-grab">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-400 font-medium text-sm">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-medium truncate">{category.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Toplam Ürün: {category.product_count || 0}
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={(checked) =>
                      onActiveChange(category.id, checked)
                    }
                  />
                  <span className="text-sm font-medium text-muted-foreground">
                    {category.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      as="link"
                      href={`/dashboard/menu/category/${category.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      Detaylar
                    </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Türkçe karakterleri normalize eden yardımcı fonksiyon
const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
};

export function MenuDetail({ id }: MenuDetailProps) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<CategoryFormData>();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchMenuAndCategories = async () => {
      const supabase = createClient();

      const { data: menuData, error: menuError } = await supabase
        .from("menus")
        .select("*")
        .eq("id", id)
        .single();

      if (menuError || !menuData) {
        setError(true);
        setLoading(false);
        return;
      }

      // Kategorileri ve ürünleri birlikte çekelim
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select(
          `
          *,
          products (
            id,
            name,
            is_active
          )
        `
        )
        .eq("menu_id", id)
        .order("sort_order", { ascending: true });

      if (categoriesError) {
        console.error("Kategoriler yüklenirken hata:", categoriesError);
        return;
      }

      setMenu(menuData);
      setCategories(categoriesData || []);
      setLoading(false);
    };

    fetchMenuAndCategories();
  }, [id]);

  const onSubmit = async (data: CategoryFormData) => {
    const supabase = createClient();

    // Mevcut en yüksek sort_order değerini bulalım
    const { data: maxSortOrder } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("menu_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder = maxSortOrder?.[0]?.sort_order ?? 0;

    const { error } = await supabase.from("categories").insert({
      name: data.name,
      menu_id: id,
      is_active: true,
      sort_order: nextSortOrder + 1,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori eklenirken bir hata oluştu",
      });
      return;
    }

    toast({
      title: "Başarılı",
      description: "Kategori başarıyla eklendi",
    });
    setIsOpen(false);
    form.reset();

    // Kategorileri yeniden yükle
    const { data: newCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("menu_id", id)
      .order("sort_order", { ascending: true });

    setCategories(newCategories || []);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    const { active, over } = event;

    if (active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          sort_order: index + 1,
        }));

        // Veritabanı güncellemesini async olarak yap
        const updateDatabase = async () => {
          const supabase = createClient();

          // Her bir güncellemeyi tek tek yapalım
          for (const item of updatedItems) {
            const { error } = await supabase
              .from("categories")
              .update({ sort_order: item.sort_order })
              .eq("id", item.id);

            if (error) {
              toast({
                variant: "destructive",
                title: "Hata",
                description:
                  "Kategori sıralaması güncellenirken bir hata oluştu.",
              });
              return;
            }
          }

          toast({
            title: "Başarılı",
            description: "Kategori sıralaması güncellendi.",
          });
        };

        updateDatabase();
        return updatedItems;
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleActiveChange = async (categoryId: string, checked: boolean) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("categories")
      .update({ is_active: checked })
      .eq("id", categoryId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori durumu güncellenirken bir hata oluştu.",
      });
      return;
    }

    setCategories((prevItems) =>
      prevItems.map((item) =>
        item.id === categoryId ? { ...item, is_active: checked } : item
      )
    );

    toast({
      title: "Başarılı",
      description: "Kategori durumu güncellendi.",
    });
  };

  const handleNameEdit = async () => {
    if (!isEditingName) {
      setEditedName(menu?.name || "");
      setIsEditingName(true);
      return;
    }

    if (!editedName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü adı boş olamaz",
      });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("menus")
      .update({ name: editedName.trim() })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü adı güncellenirken bir hata oluştu",
      });
      return;
    }

    setMenu((prev) => (prev ? { ...prev, name: editedName.trim() } : null));
    setIsEditingName(false);
    toast({
      title: "Başarılı",
      description: "Menü adı güncellendi",
    });
  };

  const filteredCategories = categories.filter((category) => {
    // Önce kategori durumuna göre filtrele
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? category.is_active
        : !category.is_active;

    if (!matchesStatus) return false;

    // Eğer arama terimi varsa, kategori içindeki ürünlerde ara
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      const hasMatchingProduct = category.products?.some((product) =>
        normalizeText(product.name).includes(normalizedSearch)
      );
      return hasMatchingProduct;
    }

    return true;
  });

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error || !menu) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-2xl font-bold h-auto py-1 w-[300px]"
                autoFocus
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameEdit();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
              />
              <Button
                onClick={handleNameEdit}
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
              >
                Kaydet
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{menu?.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => {
                  setEditedName(menu?.name || "");
                  setIsEditingName(true);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kategori Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Kategori Adı
                </label>
                <Input
                  id="name"
                  {...form.register("name", { required: true })}
                  placeholder="Örn: İçecekler"
                />
                {form.formState.errors.name && (
                  <span className="text-sm text-destructive">
                    Bu alan zorunludur
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full">
                Kategori Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="active">Aktif Kategoriler</option>
          <option value="inactive">Pasif Kategoriler</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                {categories.length === 0
                  ? 'Henüz hiç kategori eklenmemiş. "Kategori Ekle" butonunu kullanarak yeni kategoriler ekleyebilirsiniz.'
                  : "Arama kriterlerinize uygun ürün bulunamadı."}
              </p>
            </div>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={filteredCategories}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    index={index}
                    onActiveChange={handleActiveChange}
                  />
                ))}
              </div>
            </SortableContext>

            {createPortal(
              <DragOverlay
                adjustScale={true}
                dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}
              >
                {activeId ? (
                  <div className="scale-105 opacity-90 shadow-lg rounded-lg">
                    <CategoryCard
                      category={categories.find((c) => c.id === activeId)!}
                      index={categories.findIndex((c) => c.id === activeId)}
                      onActiveChange={handleActiveChange}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        )}
      </div>
    </div>
  );
}
