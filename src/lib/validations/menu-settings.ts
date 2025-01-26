import { z } from "zod";

export const menuSettingsSchema = z.object({
    welcome_title: z.string().min(1, "İşletme adı zorunludur"),
    welcome_text: z.string().optional(),
    welcome_title_font: z.string(),
    welcome_color: z.string(),
    button_text: z.string().min(1, "Buton metni zorunludur"),
    button_font: z.string(),
    button_color: z.string(),
    button_text_color: z.string(),
    background_type: z.enum(["image", "color"]),
    background_color: z.string().optional(),
    background_url: z.string().optional(),
    logo_url: z.string().optional(),
    loader_url: z.string().optional(),
    business_id: z.string()
});

export type MenuSettingsFormValues = z.infer<typeof menuSettingsSchema>; 