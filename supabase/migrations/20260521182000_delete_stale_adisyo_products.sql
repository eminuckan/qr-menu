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
  v_category_ids uuid[] := array[]::uuid[];
  v_product_ids uuid[] := array[]::uuid[];
  v_category_product_ids uuid[] := array[]::uuid[];
  v_all_product_ids uuid[] := array[]::uuid[];
  v_price_ids uuid[] := array[]::uuid[];
begin
  select coalesce(array_agg(distinct p.id), array[]::uuid[])
    into v_product_ids
    from public.products p
    join public.categories c on c.id = p.category_id
    where c.menu_id = p_menu_id
      and exists (
        select 1
          from public.adisyo_sync_mappings m
          where m.business_id = p_business_id
            and m.provider = 'adisyo'
            and m.entity_type = 'product'
            and m.local_id = p.id
            and m.is_active = false
      );

  select coalesce(array_agg(distinct c.id), array[]::uuid[])
    into v_category_ids
    from public.categories c
    where c.menu_id = p_menu_id
      and (
        exists (
          select 1
            from public.adisyo_sync_mappings m
            where m.business_id = p_business_id
              and m.provider = 'adisyo'
              and m.entity_type = 'category'
              and m.local_id = c.id
              and m.is_active = false
        )
        or (
          not exists (
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
        )
      );

  if cardinality(v_category_ids) > 0 then
    select coalesce(array_agg(id), array[]::uuid[])
      into v_category_product_ids
      from public.products
      where category_id = any(v_category_ids);
  end if;

  select coalesce(array_agg(distinct id), array[]::uuid[])
    into v_all_product_ids
    from unnest(v_product_ids || v_category_product_ids) as id;

  if cardinality(v_all_product_ids) > 0 then
    select coalesce(array_agg(id), array[]::uuid[])
      into v_price_ids
      from public.product_prices
      where product_id = any(v_all_product_ids);

    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'product_price'
        and local_id = any(v_price_ids);

    delete from public.product_prices
      where id = any(v_price_ids);

    delete from public.product_images
      where product_id = any(v_all_product_ids);

    delete from public.product_tags
      where product_id = any(v_all_product_ids);

    delete from public.product_allergens
      where product_id = any(v_all_product_ids);

    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'product'
        and local_id = any(v_all_product_ids);

    delete from public.products
      where id = any(v_all_product_ids);

    v_archived_products := cardinality(v_all_product_ids);
  end if;

  if cardinality(v_category_ids) > 0 then
    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'category'
        and local_id = any(v_category_ids);

    delete from public.categories
      where id = any(v_category_ids);

    v_archived_categories := cardinality(v_category_ids);
  end if;

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
