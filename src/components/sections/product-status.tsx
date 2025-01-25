import { ProductWithDetails } from "@/types/database";
import { Switch } from "../ui/switch";

export const ProductStatus = ({ 
    product, 
    onStatusChange 
  }: { 
    product: ProductWithDetails;
    onStatusChange: (id: string, status: boolean) => void;
  }) => {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={product.is_active}
          onCheckedChange={(checked) => onStatusChange(product.id, checked)}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        >
          <div className="h-4 w-4 rounded-full bg-background transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[19px]" />
        </Switch>
        <span className="text-sm text-muted-foreground">
          {product.is_active ? "Aktif" : "Pasif"}
        </span>
      </div>
    );
  };