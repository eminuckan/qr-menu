"use client";

import { useEffect, useState } from "react";
import { Database } from "@/lib/types/supabase";
import { Button } from "@/components/ui/button";
import { PlusCircle, GripVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
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
import PageHeader from "@/components/layout/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MenuService } from "@/lib/services/menu-service";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tables = Database['public']['Tables']
type Menu = Tables['menus']['Row']
type Category = Tables['categories']['Row'] & {
  products: Array<Pick<Tables['products']['Row'], 'id' | 'name' | 'is_active'>>
}

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
        <CardContent className="p-3 md:p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={category.cover_image || "/no-image.jpg"}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <div {...listeners} className="cursor-grab">
                  <GripVertical className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <span className="text-xs md:text-sm text-gray-400 font-medium">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-medium truncate">{category.name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">
                Toplam Ürün: {category.products?.filter((product: { is_active: boolean | null }) => product.is_active === true).length || 0}
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 md:gap-2">
                  <Switch
                    className="scale-75 md:scale-100"
                    checked={category.is_active === true}
                    onCheckedChange={(checked) =>
                      onActiveChange(category.id, checked)
                    }
                  />
                  <span className="text-xs md:text-sm font-medium text-muted-foreground">
                    {category.is_active === true ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 md:gap-2 h-8 md:h-9"
                  asChild
                >
                  <Link href={`/dashboard/menu/category/${category.id}`}>
                    <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="text-xs md:text-sm">Detaylar</span>
                  </Link>
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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
      try {
        const menuData = await MenuService.getMenu(id);
        const categoriesData = await MenuService.getCategories(id);

        setMenu(menuData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAndCategories();
  }, [id]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const maxSortOrder = categories.reduce((max, cat) => Math.max(max, cat.sort_order || 0), 0);

      const newCategory = await MenuService.addCategory({
        name: data.name,
        menu_id: id,
        is_active: true,
        sort_order: maxSortOrder + 1,
        color: '#ffffff'
      });

      setCategories(prev => [...prev, { ...newCategory, products: [] }]);

      toast({
        title: "Başarılı",
        description: "Kategori başarıyla eklendi",
      });

      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori eklenirken bir hata oluştu",
      });
    }
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
          try {
            const updateData = updatedItems.map(item => ({
              id: item.id,
              sort_order: item.sort_order,
              menu_id: item.menu_id,
              name: item.name,
              is_active: item.is_active === true,
              color: item.color || '#ffffff'
            }));

            await MenuService.updateCategoryOrder(updateData);

            toast({
              title: "Başarılı",
              description: "Kategori sıralaması güncellendi.",
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Hata",
              description: "Kategori sıralaması güncellenirken bir hata oluştu.",
            });
          }
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
    try {
      await MenuService.updateCategoryStatus(categoryId, checked);

      setCategories(prev =>
        prev.map(item =>
          item.id === categoryId ? { ...item, is_active: checked } : item
        )
      );

      toast({
        title: "Başarılı",
        description: "Kategori durumu güncellendi.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori durumu güncellenirken bir hata oluştu.",
      });
    }
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

    try {
      await MenuService.updateMenu(id, { name: newName.trim() });

      setMenu(prev => prev ? { ...prev, name: newName.trim() } : null);

      toast({
        title: "Başarılı",
        description: "Menü adı güncellendi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Menü adı güncellenirken bir hata oluştu",
      });
    }
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
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4 md:mb-6">
        <PageHeader
          title={menu?.name || ""}
          isEditable
          onTitleChange={handleNameChange}
          backPath="/dashboard/menu"
        />
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span>Menüyü Sil</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Menüyü Sil</AlertDialogTitle>
              </AlertDialogHeader>

              <div className="grid gap-4 py-4">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-destructive block mb-4">
                    Bu menüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </span>

                  <span className="block mb-2">
                    Menü ile birlikte aşağıdaki veriler de silinecektir:
                  </span>

                  <ul className="list-disc pl-4 space-y-1">
                    <li>Tüm kategoriler</li>
                    <li>Kategorilere ait fotoğraflar</li>
                    <li>Tüm ürünler</li>
                    <li>Ürün fiyatları</li>
                    <li>Ürün fotoğrafları</li>
                    <li>Ürün etiketleri</li>
                    <li>Ürün alerjenleri</li>
                  </ul>
                </div>
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
                <PlusCircle className="w-4 h-4 sm:mr-2" />
                <span>Kategori Ekle</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:min-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Yeni Kategori Ekle</DialogTitle>
                <DialogDescription className="text-muted-foreground text-base">
                  Menüye yeni bir kategori ekleyin.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Kategori Adı</Label>
                    <Input
                      id="name"
                      placeholder="Örn: Ana Yemekler"
                      {...form.register("name", {
                        required: "Kategori adı gereklidir",
                        minLength: {
                          value: 2,
                          message: "Kategori adı en az 2 karakter olmalıdır"
                        },
                        maxLength: {
                          value: 50,
                          message: "Kategori adı en fazla 50 karakter olabilir"
                        }
                      })}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit">
                    Ekle
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
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
          onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <Card className="p-4 md:p-8">
            <div className="text-center">
              <p className="text-sm md:text-base text-muted-foreground">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
