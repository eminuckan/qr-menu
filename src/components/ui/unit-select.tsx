"use client"

import { useState } from "react";
import { ProductService } from "@/lib/services/product-service";
import { Check, Plus, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";
import { Tables } from "@/lib/types/supabase";
import toast from "react-hot-toast";

interface UnitSelectProps {
    units: Tables<'units'>[];
    value: string;
    onValueChange: (value: string) => void;
    onUnitAdded?: (newUnit: Tables<'units'>) => void;
}

export function UnitSelect({ units, value, onValueChange, onUnitAdded }: UnitSelectProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddUnit = async () => {
        if (!newUnitName.trim()) return;

        setIsLoading(true);
        try {
            const newUnit = await ProductService.addUnit(newUnitName.trim());
            onUnitAdded?.(newUnit);
            onValueChange(newUnit.id);
            setIsCreating(false);
            setNewUnitName("");
            toast.success("Birim başarıyla eklendi");
        } catch (error) {
            console.error('Birim ekleme hatası:', error);
            toast.error(error instanceof Error ? error.message : "Birim eklenirken bir hata oluştu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            {isCreating ? (
                <div className="flex gap-2 flex-1">
                    <Input
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="Yeni birim adı..."
                        className="h-12"
                        autoFocus
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddUnit();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleAddUnit}
                        className="h-12 w-12"
                        disabled={isLoading}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => {
                            setIsCreating(false);
                            setNewUnitName("");
                        }}
                        className="h-12 w-12"
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <>
                    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Birim seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setIsCreating(true)}
                        className="h-12 w-12"
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    );
} 