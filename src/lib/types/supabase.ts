export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      business_users: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          cover_image: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          menu_id: string
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          cover_image?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          menu_id: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          cover_image?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          menu_id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_settings: {
        Row: {
          background_color: string | null
          background_type: string
          background_url: string | null
          business_id: string
          button_color: string | null
          button_font: string | null
          button_text: string
          button_text_color: string | null
          created_at: string
          id: string
          loader_url: string | null
          logo_url: string | null
          updated_at: string
          welcome_color: string | null
          welcome_text: string | null
          welcome_title: string | null
          welcome_title_font: string | null
        }
        Insert: {
          background_color?: string | null
          background_type?: string
          background_url?: string | null
          business_id: string
          button_color?: string | null
          button_font?: string | null
          button_text?: string
          button_text_color?: string | null
          created_at?: string
          id?: string
          loader_url?: string | null
          logo_url?: string | null
          updated_at?: string
          welcome_color?: string | null
          welcome_text?: string | null
          welcome_title?: string | null
          welcome_title_font?: string | null
        }
        Update: {
          background_color?: string | null
          background_type?: string
          background_url?: string | null
          business_id?: string
          button_color?: string | null
          button_font?: string | null
          button_text?: string
          button_text_color?: string | null
          created_at?: string
          id?: string
          loader_url?: string | null
          logo_url?: string | null
          updated_at?: string
          welcome_color?: string | null
          welcome_text?: string | null
          welcome_title?: string | null
          welcome_title_font?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          business_id: string
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_allergens: {
        Row: {
          allergen: Database["public"]["Enums"]["allergen_type"]
          created_at: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          allergen: Database["public"]["Enums"]["allergen_type"]
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          allergen?: Database["public"]["Enums"]["allergen_type"]
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_allergens_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_allergens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          image_url: string | null
          is_cover: boolean | null
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          image_url?: string | null
          is_cover?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          image_url?: string | null
          is_cover?: boolean | null
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string | null
          discounted_price: number | null
          id: string
          price: number
          product_id: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discounted_price?: number | null
          id?: string
          price: number
          product_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discounted_price?: number | null
          id?: string
          price?: number
          product_id?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_prices_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          id: string
          product_id: string | null
          tag_type: Database["public"]["Enums"]["product_tag_type"]
        }
        Insert: {
          id?: string
          product_id?: string | null
          tag_type: Database["public"]["Enums"]["product_tag_type"]
        }
        Update: {
          id?: string
          product_id?: string | null
          tag_type?: Database["public"]["Enums"]["product_tag_type"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_tags_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calories: number | null
          category_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kdv_rate: number | null
          name: string
          preparing_time: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          calories?: number | null
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kdv_rate?: number | null
          name: string
          preparing_time?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          calories?: number | null
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kdv_rate?: number | null
          name?: string
          preparing_time?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          background_color: string
          business_id: string
          created_at: string
          foreground_color: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          pdf_path: string | null
          qr_url: string
          svg_path: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string
          business_id: string
          created_at?: string
          foreground_color?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          pdf_path?: string | null
          qr_url: string
          svg_path?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string
          business_id?: string
          created_at?: string
          foreground_color?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          pdf_path?: string | null
          qr_url?: string
          svg_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string | null
          id: string
          name: string
          normalized_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          normalized_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          normalized_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_import: {
        Args: {
          menu_id: string
          category_ids: string[]
        }
        Returns: undefined
      }
      create_product_transaction: {
        Args: {
          product_id: string
          allergens: string[]
          tags: string[]
          unit_id: string
          price: number
        }
        Returns: undefined
      }
      update_products_order: {
        Args: {
          p_product_ids: string[]
          p_category_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      allergen_type:
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
        | "celery"
      product_tag_type:
        | "new"
        | "signature"
        | "chef_recommendation"
        | "popular"
        | "vegan"
        | "special"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
