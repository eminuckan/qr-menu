import { ProductWithRelations } from "@/lib/services/product-service";

export const ProductPrice = ({ product }: { product: ProductWithRelations }) => {
  const mainPrice = product.product_prices?.[0];

  console.log('mainPrice:', mainPrice);

  if (!mainPrice) return <div>-</div>;

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium">
        {mainPrice.price.toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}₺
      </span>
      <span className="text-muted-foreground text-sm">
        / {mainPrice.unit?.name || '-'}
      </span>
    </div>
  );
};
