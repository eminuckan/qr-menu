do $$
declare
  v_now timestamptz := now();
  v_category_ids uuid[] := array[]::uuid[];
  v_direct_product_ids uuid[] := array[]::uuid[];
  v_category_product_ids uuid[] := array[]::uuid[];
  v_product_ids uuid[] := array[]::uuid[];
  v_price_ids uuid[] := array[]::uuid[];
  v_deleted_categories integer := 0;
  v_deleted_products integer := 0;
  v_deleted_prices integer := 0;
begin
  select coalesce(array_agg(id), array[]::uuid[])
    into v_category_ids
    from public.categories
    where is_active = false;

  select coalesce(array_agg(id), array[]::uuid[])
    into v_direct_product_ids
    from public.products
    where is_active = false;

  select coalesce(array_agg(id), array[]::uuid[])
    into v_category_product_ids
    from public.products
    where category_id = any(v_category_ids);

  select coalesce(array_agg(distinct id), array[]::uuid[])
    into v_product_ids
    from unnest(v_direct_product_ids || v_category_product_ids) as id;

  select coalesce(array_agg(id), array[]::uuid[])
    into v_price_ids
    from public.product_prices
    where product_id = any(v_product_ids);

  v_deleted_categories := cardinality(v_category_ids);
  v_deleted_products := cardinality(v_product_ids);
  v_deleted_prices := cardinality(v_price_ids);

  update public.adisyo_sync_mappings
    set is_active = false,
        last_seen_at = v_now
    where local_id = any(v_price_ids)
      and local_table = 'product_prices';

  delete from public.product_prices
    where id = any(v_price_ids);

  delete from public.product_images
    where product_id = any(v_product_ids);

  delete from public.product_tags
    where product_id = any(v_product_ids);

  delete from public.product_allergens
    where product_id = any(v_product_ids);

  update public.adisyo_sync_mappings
    set is_active = false,
        last_seen_at = v_now
    where local_id = any(v_product_ids)
      and local_table = 'products';

  delete from public.products
    where id = any(v_product_ids);

  update public.adisyo_sync_mappings
    set is_active = false,
        last_seen_at = v_now
    where local_id = any(v_category_ids)
      and local_table = 'categories';

  delete from public.categories
    where id = any(v_category_ids);

  raise notice 'Purged inactive catalog records: % categories, % products, % prices.',
    v_deleted_categories,
    v_deleted_products,
    v_deleted_prices;
end;
$$;
