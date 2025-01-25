// Temel timestamp alanları için interface
interface Timestamps {
  created_at: string;
  updated_at?: string;
}

// Temel ortak alanlar için interface
interface BaseEntity extends Timestamps {
  id: string;
}

// Sıralama ve aktiflik durumu için interface
interface Sortable {
  sort_order: number;
  is_active: boolean;
}

// Renk ve görsel için interface
interface Appearance {
  color?: string | null;
  cover_image?: string | null;
}

// Menu tablosu için type
export interface Menu extends BaseEntity, Sortable, Appearance {
  name: string;
  categories?: Category[];
}

// Category tablosu için type
export interface Category extends BaseEntity, Sortable, Appearance {
  menu_id: string;
  name: string;
  products?: Product[];
  product_count?: number;
}

// Product tablosu için type
export interface Product extends BaseEntity, Sortable {
  category_id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  kdv_rate?: number | null;
  calories?: number | null;
  preparing_time?: number | null;
}

// Unit tablosu için type
export interface Unit extends BaseEntity {
  name: string;
  normalized_name: string;
}

// ProductPrice tablosu için type
export interface ProductPrice extends BaseEntity {
  product_id: string;
  unit_id: string;
  units?: Unit;
  price: number;
  discounted_price?: number | null;
}

// ProductImage tablosu için type
export interface ProductImage extends BaseEntity {
  product_id: string;
  image_url?: string | null;
  is_cover: boolean;
  sort_order: number;
  file?: File;
  preview?: string;
  isExisting?: boolean;
}

// Alerjen enum tipi
export type AllergenType =
  | "gluten"
  | "shellfish"
  | "fish"
  | "eggs"
  | "dairy"
  | "nuts"
  | "peanuts"
  | "wheat"
  | "sulfur_dioxide"
  | "mustard"
  | "sesame"
  | "soy"
  | "lupin"
  | "celery";

// Görünen isimler için alerjen mapping
export const AllergenLabels: Record<AllergenType, string> = {
  gluten: "Gluten",
  shellfish: "Kabuklu Deniz Ürünü",
  fish: "Balık",
  eggs: "Yumurta",
  dairy: "Süt Ürünü",
  nuts: "Kuruyemiş",
  peanuts: "Yer Fıstığı",
  wheat: "Buğday",
  sulfur_dioxide: "Kükürt Dioksit",
  mustard: "Hardal",
  sesame: "Susam",
  soy: "Soya",
  lupin: "Acı Bakla",
  celery: "Kereviz",
};

// ProductAllergen tablosu için type
export interface ProductAllergen extends BaseEntity {
  product_id: string;
  allergen: AllergenType;
}

// Ürün etiketi enum tipi
export type ProductTagType =
  | "new"
  | "signature"
  | "chef_recommendation"
  | "popular"
  | "vegan"
  | "special";

// Ürün etiketleri için Türkçe karşılıklar
export const ProductTagLabels: Record<ProductTagType, string> = {
  new: "Yeni",
  signature: "İmza Ürün",
  chef_recommendation: "Şefin Önerisi",
  popular: "Popüler",
  vegan: "Vegan",
  special: "Özel",
};

// ProductTag tablosu için type
export interface ProductTag extends BaseEntity {
  product_id: string;
  tag_type: ProductTagType;
}

// İlişkili veri tipleri
export interface ProductWithDetails extends Product {
  product_prices: ProductPrice[];
  product_allergens: { allergen: AllergenType }[];
  product_tags: { tag_type: ProductTagType }[];
  product_images: {
    id: string;
    image_url: string;
    is_cover: boolean;
    sort_order: number;
  }[];
}

export interface CategoryWithProducts extends Category {
  products: ProductWithDetails[];
}

export interface MenuWithCategories extends Menu {
  categories: CategoryWithProducts[];
}

// Form değerleri için type
export interface ProductFormValues {
  name: string;
  description?: string;
  color?: string;
  calories?: number;
  preparing_time?: number;
  allergens: AllergenType[];
  tags: ProductTagType[];
  unit_id: string;
  price: number;
}

// DTO tipleri
export interface UnitCreateDTO {
  name: string;
}
