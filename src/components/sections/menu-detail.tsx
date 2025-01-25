"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, Menu } from "@/types/database";
import { Button } from "@/components/ui/button";
import { PlusCircle, GripVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Dialog,
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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import PageHeader from "@/components/layout/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MenuService } from "@/lib/services/menu-service";
import { useRouter } from "next/navigation";

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
                Toplam Ürün: {category.products?.filter(product => product.is_active).length || 0}
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
  const router = useRouter();

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

        const updateDatabase = async () => {
          const supabase = createClient();

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

  const handleNameChange = async (newName: string) => {
    if (!newName.trim()) {
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
      .update({ name: newName.trim() })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü adı güncellenirken bir hata oluştu",
      });
      return;
    }

    setMenu((prev) => (prev ? { ...prev, name: newName.trim() } : null));
    toast({
      title: "Başarılı",
      description: "Menü adı güncellendi",
    });
  };

  const handleDelete = async () => {
    try {
      await MenuService.deleteMenu(id);
      toast({
        title: "Başarılı",
        description: "Menü ve ilişkili tüm veriler başarıyla silindi",
      });
      router.push('/dashboard/menu');
    } catch (error) {
      console.error('Menü silme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Menü silinirken bir hata oluştu",
      });
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? category.is_active
          : !category.is_active;

    if (!matchesStatus) return false;

    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      return normalizeText(category.name).includes(normalizedSearch);
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
        <PageHeader
          title={menu?.name || ""}
          isEditable
          onTitleChange={handleNameChange}
          backPath="/dashboard/menu"
        />
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Menüyü Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Menüyü Sil</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Bu menüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Menü ile birlikte aşağıdaki veriler de silinecektir:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Tüm kategoriler</li>
                  <li>Kategorilere ait fotoğraflar</li>
                  <li>Tüm ürünler</li>
                  <li>Ürün fiyatları</li>
                  <li>Ürün fotoğrafları</li>
                  <li>Ürün etiketleri</li>
                  <li>Ürün alerjenleri</li>
                </ul>
              </div>
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
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" />
                Kategori Ekle
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            <SelectItem value="active">Aktif Kategoriler</SelectItem>
            <SelectItem value="inactive">Pasif Kategoriler</SelectItem>
          </SelectContent>
        </Select>
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
