"use client";

import React, { useCallback, useState } from "react";
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

const Page = () => {
  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuName, setNewMenuName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => console.log("Adisyodan menü getir")}
          >
            <RefreshCw className="h-5 w-5" />
            Adisyodan Menü Getir
          </Button>
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
    </div>
  );
};

export default Page;
