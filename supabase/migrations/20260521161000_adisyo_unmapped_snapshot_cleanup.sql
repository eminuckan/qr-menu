create or replace function public.cleanup_adisyo_unmapped_snapshot_entities(
  p_business_id uuid,
  p_menu_id uuid,
  p_run_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_archived_categories integer := 0;
  v_archived_products integer := 0;
begin
  with stale_products as (
    select p.id
      from public.products p
      join public.categories c on c.id = p.category_id
      where c.menu_id = p_menu_id
        and coalesce(p.is_active, true) = true
        and not exists (
          select 1
            from public.adisyo_sync_mappings m
            where m.business_id = p_business_id
              and m.provider = 'adisyo'
              and m.entity_type = 'product'
              and m.local_id = p.id
              and m.last_seen_run_id = p_run_id
              and m.is_active = true
        )
  ),
  archived_products as (
    update public.products p
      set is_active = false,
          updated_at = v_now
      from stale_products sp
      where p.id = sp.id
      returning p.id
  )
  select count(*) into v_archived_products from archived_products;

  with stale_categories as (
    select c.id
      from public.categories c
      where c.menu_id = p_menu_id
        and coalesce(c.is_active, true) = true
        and not exists (
          select 1
            from public.adisyo_sync_mappings m
            where m.business_id = p_business_id
              and m.provider = 'adisyo'
              and m.entity_type = 'category'
              and m.local_id = c.id
              and m.last_seen_run_id = p_run_id
              and m.is_active = true
        )
        and not exists (
          select 1
            from public.products p
            where p.category_id = c.id
              and coalesce(p.is_active, true) = true
        )
  ),
  archived_categories as (
    update public.categories c
      set is_active = false,
          updated_at = v_now
      from stale_categories sc
      where c.id = sc.id
      returning c.id
  )
  select count(*) into v_archived_categories from archived_categories;

  return jsonb_build_object(
    'archivedCategories', v_archived_categories,
    'archivedProducts', v_archived_products
  );
end;
$$;

revoke all on function public.cleanup_adisyo_unmapped_snapshot_entities(uuid, uuid, uuid) from public;
revoke all on function public.cleanup_adisyo_unmapped_snapshot_entities(uuid, uuid, uuid) from anon;
revoke all on function public.cleanup_adisyo_unmapped_snapshot_entities(uuid, uuid, uuid) from authenticated;
grant execute on function public.cleanup_adisyo_unmapped_snapshot_entities(uuid, uuid, uuid) to service_role;
