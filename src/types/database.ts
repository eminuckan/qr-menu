// Temel timestamp alanları için interface
interface Timestamps {
  created_at: string;
  updated_at: string;
}

// Menu tablosu için type
export type Menu = {
  id: string;
  name: string;
  is_active: boolean;
  cover_image: string | null;
  color: string | null;
  sort_order: number;
} & Timestamps;

// Category tablosu için type
export type Category = {
  id: string;
  menu_id: string;
  name: string;
  is_active: boolean;
  color: string | null;
  cover_image: string | null;
  sort_order: number;
  product_count?: number;
  products?: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
} & Timestamps;

// Product tablosu için type
export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  kdv_rate: number | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  calories: number | null;
  preparing_time: number | null;
} & Timestamps;

// Unit tablosu için type
export type Unit = {
  id: string;
  name: string;
  normalized_name: string;
} & Timestamps;

// ProductPrice tablosu için type
export type ProductPrice = {
  id: string;
  product_id: string;
  unit_id: string;
  price: number;
  discounted_price: number | null;
} & Timestamps;

// ProductImage tablosu için type
export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string | null;
  is_cover: boolean;
  sort_order: number;
};

// Alerjen enum tipi
export enum AllergenType {
  GLUTEN = "Gluten",
  SHELLFISH = "Kabuklu Deniz Ürünü",
  FISH = "Balık",
  EGGS = "Yumurta",
  DAIRY = "Süt Ürünü",
  NUTS = "Kuruyemiş",
  PEANUTS = "Yer Fıstığı",
  WHEAT = "Buğday",
  SULFUR_DIOXIDE = "Kükürt Dioksit",
  MUSTARD = "Hardal",
  SESAME = "Susam",
  SOY = "Soya",
  LUPIN = "Acı Bakla",
  CELERY = "Kereviz",
}

// Görünen isimler için alerjen mapping
export const AllergenLabels: Record<AllergenType, string> = {
  [AllergenType.GLUTEN]: "Gluten",
  [AllergenType.SHELLFISH]: "Kabuklu Deniz Ürünü",
  [AllergenType.FISH]: "Balık",
  [AllergenType.EGGS]: "Yumurta",
  [AllergenType.DAIRY]: "Süt Ürünü",
  [AllergenType.NUTS]: "Kuruyemiş",
  [AllergenType.PEANUTS]: "Yer Fıstığı",
  [AllergenType.WHEAT]: "Buğday",
  [AllergenType.SULFUR_DIOXIDE]: "Kükürt Dioksit",
  [AllergenType.MUSTARD]: "Hardal",
  [AllergenType.SESAME]: "Susam",
  [AllergenType.SOY]: "Soya",
  [AllergenType.LUPIN]: "Acı Bakla",
  [AllergenType.CELERY]: "Kereviz",
};

// ProductAllergen tablosu için type
export type ProductAllergen = {
  id: string;
  product_id: string;
  allergen: AllergenType;
} & Timestamps;

// Ürün etiketi enum tipi
export enum ProductTagType {
  NEW = "new",
  SIGNATURE = "signature",
  CHEF_RECOMMENDATION = "chef_recommendation",
  POPULAR = "popular",
  VEGAN = "vegan",
  SPECIAL = "special",
}

// Ürün etiketleri için Türkçe karşılıklar
export const ProductTagLabels: Record<ProductTagType, string> = {
  [ProductTagType.NEW]: "Yeni",
  [ProductTagType.SIGNATURE]: "İmza Ürün",
  [ProductTagType.CHEF_RECOMMENDATION]: "Şefin Önerisi",
  [ProductTagType.POPULAR]: "Popüler",
  [ProductTagType.VEGAN]: "Vegan",
  [ProductTagType.SPECIAL]: "Özel",
};

// ProductTag tablosu için type
export type ProductTag = {
  id: string;
  product_id: string;
  tag_type: ProductTagType;
};

// İlişkili veri tipleri
export type ProductWithDetails = Product & {
  category: Category;
  prices: ProductPrice[];
  images: ProductImage[];
  allergens: ProductAllergen[];
  tags: ProductTag[];
  unit: Unit;
};

export type CategoryWithProducts = Category & {
  products: ProductWithDetails[];
};

export type MenuWithCategories = Menu & {
  categories: CategoryWithProducts[];
};
