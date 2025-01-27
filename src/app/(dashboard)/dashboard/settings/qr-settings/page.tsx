"use client";

import { useState, useEffect } from "react";
import { QRCustomization } from "@/components/sections/qr-customization";
import { QRList } from "@/components/sections/qr-list";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { QRCode, Business } from "@/types/database";
import { BusinessService } from "@/lib/services/business-service";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function QRSettingsPage() {
    const [showCustomization, setShowCustomization] = useState(false);
    const [editingQR, setEditingQR] = useState<QRCode | null>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        try {
            const data = await BusinessService.getBusinesses();
            setBusinesses(data);
            if (data.length > 0) {
                setSelectedBusinessId(data[0].id);
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "İşletmeler yüklenirken bir hata oluştu",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (qr: QRCode) => {
        setEditingQR(qr);
        setShowCustomization(true);
    };

    const toggleCustomization = () => {
        setShowCustomization(!showCustomization);
        if (showCustomization) {
            setEditingQR(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">QR Kodları</h1>
                <div className="flex items-center gap-4">
                    <Select
                        value={selectedBusinessId}
                        onValueChange={setSelectedBusinessId}
                    >
                        <SelectTrigger className="w-[240px]">
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
                    <Button onClick={toggleCustomization}>
                        {showCustomization ? (
                            <>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Geri Dön
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Yeni QR Kod Ekle
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {showCustomization ? (
                <QRCustomization
                    editingQR={editingQR}
                    selectedBusiness={businesses.find(b => b.id === selectedBusinessId) || null}
                    onSave={() => {
                        setShowCustomization(false);
                        setEditingQR(null);
                    }}
                />
            ) : (
                <QRList
                    onEdit={handleEdit}
                    selectedBusinessId={selectedBusinessId}
                />
            )}
        </div>
    );
} 