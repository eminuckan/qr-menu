import { Database } from "./types/supabase";

export const AllergenLabels: Record<Database['public']['Enums']['allergen_type'], string> = {
    gluten: "Gluten",
    shellfish: "Kabuklu Deniz Ürünleri",
    fish: "Balık",
    eggs: "Yumurta",
    dairy: "Süt Ürünleri",
    nuts: "Kuruyemiş",
    peanuts: "Fıstık",
    wheat: "Buğday",
    sulfur_dioxide: "Sülfür Dioksit",
    mustard: "Hardal",
    sesame: "Susam",
    soy: "Soya",
    lupin: "Acı Bakla",
    celery: "Kereviz"
};

export const ProductTagLabels: Record<Database['public']['Enums']['product_tag_type'], string> = {
    new: "Yeni",
    signature: "İmza",
    chef_recommendation: "Şef Önerisi",
    popular: "Popüler",
    vegan: "Vegan",
    special: "Özel"
}; 