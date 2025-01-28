import { Database } from "./supabase";
import { ProductWithRelations } from "../services/product-service";

type Tables = Database['public']['Tables'];

export type Category = Tables['categories']['Row'] & {
    products: ProductWithRelations[];
};

export type Menu = Tables['menus']['Row'] & {
    categories: Category[];
}; 