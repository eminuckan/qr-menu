"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { BusinessService } from "@/lib/services/business-service";
import { businessFormSchema, type BusinessFormValues } from "@/lib/validations/business";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Pencil, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { useBusinessContext } from "@/lib/contexts/business-context";
import { Tables } from "@/lib/types/supabase";

type BusinessWithUsers = Tables<'businesses'> & {
    business_users: Tables<'business_users'>[];
};

export default function BusinessSettingsPage() {
    const [businesses, setBusinesses] = useState<BusinessWithUsers[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const [editingBusiness, setEditingBusiness] = useState<BusinessWithUsers | null>(null);
    const [deletingBusiness, setDeletingBusiness] = useState<BusinessWithUsers | null>(null);
    const { setHasBusiness } = useBusinessContext();

    const form = useForm<BusinessFormValues>({
        resolver: zodResolver(businessFormSchema),
        defaultValues: {
            name: "",
        },
    });

    const editForm = useForm<BusinessFormValues>({
        resolver: zodResolver(businessFormSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        const loadBusinesses = async () => {
            try {
                const data = await BusinessService.getBusinesses();
                setBusinesses(data as BusinessWithUsers[]);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "İşletmeler yüklenirken bir hata oluştu.",
                });
            } finally {
                setLoading(false);
            }
        };

        loadBusinesses();
    }, [toast]);

    const onSubmit = async (values: BusinessFormValues) => {
        try {
            await BusinessService.createBusiness(values);
            form.reset();

            // İşletmeleri yeniden yükle
            const data = await BusinessService.getBusinesses();
            setBusinesses(data as BusinessWithUsers[]);

            // Context'i güncelle
            setHasBusiness(true);

            toast({
                title: "Başarılı",
                description: "İşletme başarıyla oluşturuldu.",
            });

            router.refresh();
        } catch (error) {
            console.error('Business creation error:', error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: error instanceof Error
                    ? error.message
                    : "İşletme oluşturulurken bir hata oluştu.",
            });
        }
    };

    const handleEdit = async (values: BusinessFormValues) => {
        try {
            if (!editingBusiness) return;

            await BusinessService.updateBusiness(editingBusiness.id, values);

            // İşletmeleri yeniden yükle
            const data = await BusinessService.getBusinesses();
            setBusinesses(data as BusinessWithUsers[]);

            setEditingBusiness(null);
            editForm.reset();

            toast({
                title: "Başarılı",
                description: "İşletme başarıyla güncellendi.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: error instanceof Error
                    ? error.message
                    : "İşletme güncellenirken bir hata oluştu.",
            });
        }
    };

    const handleDelete = async () => {
        try {
            if (!deletingBusiness) return;

            await BusinessService.deleteBusiness(deletingBusiness.id);

            // İşletmeleri güncelle
            const updatedBusinesses = businesses.filter(b => b.id !== deletingBusiness.id);
            setBusinesses(updatedBusinesses);

            // Eğer son işletme silindiyse context'i güncelle
            if (updatedBusinesses.length === 0) {
                setHasBusiness(false);
            }

            setDeletingBusiness(null);

            toast({
                title: "Başarılı",
                description: "İşletme başarıyla silindi.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "İşletme silinirken bir hata oluştu.",
            });
        }
    };

    useEffect(() => {
        if (editingBusiness) {
            editForm.reset({
                name: editingBusiness.name
            });
        }
    }, [editingBusiness, editForm]);

    return (
        <div>
            <div>
                <h3 className="text-lg font-medium">İşletme Ayarları</h3>
                <p className="text-sm text-muted-foreground">
                    İşletmelerinizi buradan yönetebilirsiniz.
                </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Yeni İşletme Ekle</CardTitle>
                        <CardDescription>
                            Yeni bir işletme eklemek için aşağıdaki formu doldurun.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>İşletme Adı</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Örn: Cafe Istanbul" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">İşletme Ekle</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>İşletmelerim</CardTitle>
                        <CardDescription>
                            Sahip olduğunuz ve yönettiğiniz işletmeler.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-4">Yükleniyor...</div>
                        ) : businesses.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Henüz bir işletmeniz bulunmuyor.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {businesses.map((business) => (
                                    <div
                                        key={business.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <div className="font-medium">
                                                    {business.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {business.business_users[0].role}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingBusiness(business)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingBusiness(business)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editingBusiness} onOpenChange={() => setEditingBusiness(null)}>
                <DialogContent className="sm:w-[600px] p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-semibold">İşletme Düzenle</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-base">
                            İşletme bilgilerini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-8">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-medium">İşletme Adı</FormLabel>
                                        <FormControl>
                                            <Input className="h-12" placeholder="İşletme adını girin" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setEditingBusiness(null)}
                                >
                                    İptal
                                </Button>
                                <Button type="submit" size="lg">Güncelle</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingBusiness} onOpenChange={() => setDeletingBusiness(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>İşletmeyi Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                    </AlertDialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-destructive">Bu işlem geri alınamaz!</p>
                            <p>İşletmeyi sildiğinizde:</p>

                            <span className="block mb-2">
                                İşletme ile birlikte aşağıdaki veriler de kalıcı olarak silinecektir:
                            </span>

                            <ul className="list-disc pl-4 space-y-1">
                                <li>Tüm menüler</li>
                                <li>Menülere ait kategoriler</li>
                                <li>Kategorilere ait ürünler</li>
                                <li>Ürünlere ait fiyatlar, alerjenler ve etiketler</li>
                                <li>Ürün görselleri ve diğer dosyalar</li>
                            </ul>
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            İşletmeyi Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
