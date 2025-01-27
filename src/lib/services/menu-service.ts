import { createClient } from "../supabase/client";
import { MenuFormValues } from "../validations/menu";

export const MenuService = {
    async getMenus() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        const { data, error } = await supabase
            .from('menus')
            .select(`
                *,
                businesses!inner (
                    id,
                    name,
                    business_users!inner (
                        user_id
                    )
                )
            `)
            .eq('businesses.business_users.user_id', user.id);

        if (error) throw error;
        return data;
    },

    async createMenu(values: MenuFormValues & { business_id: string }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        // Kullanıcının bu işletmeye erişimi var mı kontrol et
        const { data: hasAccess } = await supabase
            .from('business_users')
            .select('business_id')
            .eq('business_id', values.business_id)
            .eq('user_id', user.id)
            .single();

        if (!hasAccess) throw new Error("Bu işletmeye erişiminiz yok");

        const { data, error } = await supabase
            .from('menus')
            .insert({
                name: values.name,
                business_id: values.business_id,
                is_active: true,
                sort_order: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateMenu(id: string, values: MenuFormValues & { business_id: string }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        // Kullanıcının bu işletmeye erişimi var mı kontrol et
        const { data: hasAccess } = await supabase
            .from('business_users')
            .select('business_id')
            .eq('business_id', values.business_id)
            .eq('user_id', user.id)
            .single();

        if (!hasAccess) throw new Error("Bu işletmeye erişiminiz yok");

        const { data, error } = await supabase
            .from('menus')
            .update({
                name: values.name,
                business_id: values.business_id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteMenu(id: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kullanıcı bulunamadı");

        // Menünün kullanıcıya ait olup olmadığını kontrol et
        const { data: menu } = await supabase
            .from('menus')
            .select(`
                id,
                businesses!inner (
                    business_users!inner (
                        user_id
                    )
                )
            `)
            .eq('id', id)
            .eq('businesses.business_users.user_id', user.id)
            .single();

        if (!menu) throw new Error("Bu menüyü silme yetkiniz yok");

        const { error } = await supabase
            .from('menus')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async moveMenuToBusiness(menuId: string, businessId: string) {
        const supabase = createClient();

        try {
            // Önce hedef işletmenin adını al
            const { data: business, error: businessError } = await supabase
                .from('businesses')
                .select('name')
                .eq('id', businessId)
                .single();

            if (businessError) throw businessError;

            // Menüyü taşı
            const { error } = await supabase
                .from('menus')
                .update({ business_id: businessId })
                .eq('id', menuId);

            if (error) throw error;

            return {
                success: true,
                businessName: business.name // İşletme adını da dön
            };
        } catch (error) {
            console.error('Error moving menu:', error);
            throw error;
        }
    },

    async getMenusByBusinessId(businessId: string) {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('menus')
            .select(`
                id,
                name,
                is_active,
                sort_order,
                categories (
                    id,
                    name,
                    cover_image,
                    sort_order,
                    is_active
                )
            `)
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('sort_order');

        if (error) throw error;
        return data;
    }
}; 