import * as z from "zod";
import { Database } from "@/lib/types/supabase";

type Tables = Database['public']['Tables']

export const menuSettingsSchema = z.object({
    business_id: z.string(),
    welcome_title: z.string().optional().default(""),
    welcome_title_font: z.string().optional().default(""),
    welcome_text: z.string().optional().default("Hoş geldiniz"),
    welcome_color: z.string().optional().default("#000000"),
    button_text: z.string().default("Menüyü İncele"),
    button_font: z.string().optional().default(""),
    button_color: z.string().optional().default("#000000"),
    button_text_color: z.string().optional().default("#FFFFFF"),
    background_type: z.enum(["color", "image"]).default("image"),
    background_color: z.string().optional().default(""),
    background_url: z.string().optional().default(""),
    logo_url: z.string().optional().default(""),
    loader_url: z.string().optional().default(""),
});

export type MenuSettingsFormValues = z.infer<typeof menuSettingsSchema>; 