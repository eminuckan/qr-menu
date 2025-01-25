import { ProductWithDetails } from "@/types/database";

export const ProductPrice = ({ product }: { product: ProductWithDetails }) => {
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
        / {mainPrice.units?.name || '-'}
      </span>
    </div>
  );
};
