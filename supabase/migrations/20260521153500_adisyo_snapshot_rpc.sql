create index if not exists categories_menu_name_idx
  on public.categories (menu_id, name);

create index if not exists products_category_name_idx
  on public.products (category_id, name);

create index if not exists product_prices_product_unit_idx
  on public.product_prices (product_id, unit_id);

create index if not exists units_normalized_name_idx
  on public.units (normalized_name);

create or replace function public.sync_adisyo_products_snapshot(
  p_business_id uuid,
  p_menu_id uuid,
  p_run_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_category jsonb;
  v_product jsonb;
  v_unit jsonb;
  v_price jsonb;
  v_mapping record;
  v_category_id uuid;
  v_product_id uuid;
  v_unit_id uuid;
  v_price_id uuid;
  v_category_external_id text;
  v_product_external_id text;
  v_unit_external_id text;
  v_price_external_id text;
  v_category_name text;
  v_product_name text;
  v_unit_name text;
  v_normalized_unit text;
  v_category_sort integer := 0;
  v_product_sort integer := 0;
  v_price_value numeric;
  v_order_type integer;
  v_old_category record;
  v_old_product record;
  v_old_price record;
  v_seen_categories text[] := array[]::text[];
  v_seen_products text[] := array[]::text[];
  v_seen_prices text[] := array[]::text[];
  v_total_categories integer := 0;
  v_total_products integer := 0;
  v_imported_categories integer := 0;
  v_updated_categories integer := 0;
  v_archived_categories integer := 0;
  v_reactivated_categories integer := 0;
  v_imported_products integer := 0;
  v_updated_products integer := 0;
  v_archived_products integer := 0;
  v_reactivated_products integer := 0;
  v_imported_prices integer := 0;
  v_updated_prices integer := 0;
  v_removed_prices integer := 0;
begin
  if jsonb_typeof(coalesce(p_payload, '[]'::jsonb)) <> 'array' then
    raise exception 'Adisyo payload must be a JSON array.';
  end if;

  v_total_categories := jsonb_array_length(coalesce(p_payload, '[]'::jsonb));

  for v_category in select value from jsonb_array_elements(coalesce(p_payload, '[]'::jsonb))
  loop
    v_category_sort := v_category_sort + 1;
    v_product_sort := 0;
    v_category_name := trim(regexp_replace(coalesce(v_category->>'categoryName', ''), '\s+', ' ', 'g'));
    if v_category_name = '' then
      v_category_name := 'Adsiz kategori';
    end if;

    v_category_external_id := coalesce(nullif(v_category->>'categoryId', ''), v_category_name);
    v_seen_categories := array_append(v_seen_categories, v_category_external_id);
    v_category_id := null;

    select local_id
      into v_category_id
      from public.adisyo_sync_mappings
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'category'
        and external_id = v_category_external_id
      limit 1;

    if v_category_id is not null then
      select id, menu_id, name, is_active, sort_order, color
        into v_old_category
        from public.categories
        where id = v_category_id;

      if found then
        if v_old_category.menu_id is distinct from p_menu_id
          or v_old_category.name is distinct from v_category_name
          or v_old_category.is_active is distinct from true
          or v_old_category.sort_order is distinct from v_category_sort
          or v_old_category.color is distinct from '#ffffff' then
          update public.categories
            set menu_id = p_menu_id,
                name = v_category_name,
                is_active = true,
                sort_order = v_category_sort,
                color = '#ffffff',
                updated_at = v_now
            where id = v_category_id;

          v_updated_categories := v_updated_categories + 1;

          if coalesce(v_old_category.is_active, false) = false then
            v_reactivated_categories := v_reactivated_categories + 1;
          end if;
        end if;
      else
        v_category_id := null;
      end if;
    end if;

    if v_category_id is null then
      select id, is_active
        into v_old_category
        from public.categories
        where menu_id = p_menu_id
          and name = v_category_name
        limit 1;

      if found then
        v_category_id := v_old_category.id;

        update public.categories
          set is_active = true,
              sort_order = v_category_sort,
              color = '#ffffff',
              updated_at = v_now
          where id = v_category_id;

        v_updated_categories := v_updated_categories + 1;

        if coalesce(v_old_category.is_active, false) = false then
          v_reactivated_categories := v_reactivated_categories + 1;
        end if;
      else
        insert into public.categories (menu_id, name, is_active, sort_order, color)
          values (p_menu_id, v_category_name, true, v_category_sort, '#ffffff')
          returning id into v_category_id;

        v_imported_categories := v_imported_categories + 1;
      end if;
    end if;

    insert into public.adisyo_sync_mappings (
      business_id, provider, entity_type, external_id, local_table, local_id,
      first_seen_run_id, last_seen_run_id, first_seen_at, last_seen_at, is_active, source_payload
    )
    values (
      p_business_id, 'adisyo', 'category', v_category_external_id, 'categories', v_category_id,
      p_run_id, p_run_id, v_now, v_now, true, v_category
    )
    on conflict (business_id, provider, entity_type, external_id)
    do update set
      local_table = excluded.local_table,
      local_id = excluded.local_id,
      last_seen_run_id = excluded.last_seen_run_id,
      last_seen_at = excluded.last_seen_at,
      is_active = true,
      source_payload = excluded.source_payload;

    for v_product in select value from jsonb_array_elements(coalesce(v_category->'products', '[]'::jsonb))
    loop
      v_total_products := v_total_products + 1;
      v_product_sort := v_product_sort + 1;
      v_product_name := trim(regexp_replace(coalesce(v_product->>'productName', ''), '\s+', ' ', 'g'));
      if v_product_name = '' then
        v_product_name := 'Adsiz urun';
      end if;

      v_product_external_id := coalesce(nullif(v_product->>'productId', ''), v_product_name);
      v_seen_products := array_append(v_seen_products, v_product_external_id);
      v_product_id := null;

      select local_id
        into v_product_id
        from public.adisyo_sync_mappings
        where business_id = p_business_id
          and provider = 'adisyo'
          and entity_type = 'product'
          and external_id = v_product_external_id
        limit 1;

      if v_product_id is not null then
        select id, category_id, name, kdv_rate, is_active, sort_order
          into v_old_product
          from public.products
          where id = v_product_id;

        if found then
          if v_old_product.category_id is distinct from v_category_id
            or v_old_product.name is distinct from v_product_name
            or v_old_product.kdv_rate is distinct from nullif(v_product->>'taxRate', '')::numeric
            or v_old_product.is_active is distinct from true
            or v_old_product.sort_order is distinct from v_product_sort then
            update public.products
              set category_id = v_category_id,
                  name = v_product_name,
                  kdv_rate = nullif(v_product->>'taxRate', '')::numeric,
                  is_active = true,
                  sort_order = v_product_sort,
                  updated_at = v_now
              where id = v_product_id;

            v_updated_products := v_updated_products + 1;

            if coalesce(v_old_product.is_active, false) = false then
              v_reactivated_products := v_reactivated_products + 1;
            end if;
          end if;
        else
          v_product_id := null;
        end if;
      end if;

      if v_product_id is null then
        select id, is_active
          into v_old_product
          from public.products
          where category_id = v_category_id
            and name = v_product_name
          limit 1;

        if found then
          v_product_id := v_old_product.id;

          update public.products
            set kdv_rate = nullif(v_product->>'taxRate', '')::numeric,
                is_active = true,
                sort_order = v_product_sort,
                updated_at = v_now
            where id = v_product_id;

          v_updated_products := v_updated_products + 1;

          if coalesce(v_old_product.is_active, false) = false then
            v_reactivated_products := v_reactivated_products + 1;
          end if;
        else
          insert into public.products (category_id, name, kdv_rate, is_active, sort_order)
            values (v_category_id, v_product_name, nullif(v_product->>'taxRate', '')::numeric, true, v_product_sort)
            returning id into v_product_id;

          v_imported_products := v_imported_products + 1;
        end if;
      end if;

      insert into public.adisyo_sync_mappings (
        business_id, provider, entity_type, external_id, local_table, local_id,
        first_seen_run_id, last_seen_run_id, first_seen_at, last_seen_at, is_active, source_payload
      )
      values (
        p_business_id, 'adisyo', 'product', v_product_external_id, 'products', v_product_id,
        p_run_id, p_run_id, v_now, v_now, true, v_product
      )
      on conflict (business_id, provider, entity_type, external_id)
      do update set
        local_table = excluded.local_table,
        local_id = excluded.local_id,
        last_seen_run_id = excluded.last_seen_run_id,
        last_seen_at = excluded.last_seen_at,
        is_active = true,
        source_payload = excluded.source_payload;

      for v_unit in select value from jsonb_array_elements(coalesce(v_product->'productUnits', '[]'::jsonb))
      loop
        v_price := null;
        v_unit_id := null;

        select value
          into v_price
          from jsonb_array_elements(coalesce(v_unit->'prices', '[]'::jsonb))
          where nullif(value->>'orderType', '')::integer = 1
          limit 1;

        if v_price is null then
          select value
            into v_price
            from jsonb_array_elements(coalesce(v_unit->'prices', '[]'::jsonb))
            limit 1;
        end if;

        if v_price is null then
          continue;
        end if;

        v_unit_name := trim(regexp_replace(coalesce(v_unit->>'unitName', ''), '\s+', ' ', 'g'));
        if v_unit_name = '' then
          v_unit_name := 'Adet';
        end if;

        v_normalized_unit := lower(v_unit_name);
        v_unit_external_id := coalesce(nullif(v_unit->>'productUnitId', ''), v_unit_name);
        v_order_type := nullif(v_price->>'orderType', '')::integer;
        v_price_value := nullif(v_price->>'price', '')::numeric;
        v_price_external_id := v_product_external_id || ':' || v_unit_external_id || ':' || v_order_type::text;
        v_seen_prices := array_append(v_seen_prices, v_price_external_id);
        v_price := null;

        select id
          into v_unit_id
          from public.units
          where normalized_name = v_normalized_unit
          limit 1;

        if v_unit_id is null then
          insert into public.units (name, normalized_name)
            values (v_unit_name, v_normalized_unit)
            returning id into v_unit_id;
        end if;

        v_price_id := null;

        select local_id
          into v_price_id
          from public.adisyo_sync_mappings
          where business_id = p_business_id
            and provider = 'adisyo'
            and entity_type = 'product_price'
            and external_id = v_price_external_id
          limit 1;

        if v_price_id is not null then
          select id, product_id, unit_id, price
            into v_old_price
            from public.product_prices
            where id = v_price_id;

          if found then
            if v_old_price.product_id is distinct from v_product_id
              or v_old_price.unit_id is distinct from v_unit_id
              or v_old_price.price is distinct from v_price_value then
              update public.product_prices
                set product_id = v_product_id,
                    unit_id = v_unit_id,
                    price = v_price_value,
                    updated_at = v_now
                where id = v_price_id;

              v_updated_prices := v_updated_prices + 1;
            end if;
          else
            v_price_id := null;
          end if;
        end if;

        if v_price_id is null then
          select id, price
            into v_old_price
            from public.product_prices
            where product_id = v_product_id
              and unit_id = v_unit_id
            limit 1;

          if found then
            v_price_id := v_old_price.id;

            if v_old_price.price is distinct from v_price_value then
              update public.product_prices
                set price = v_price_value,
                    updated_at = v_now
                where id = v_price_id;

              v_updated_prices := v_updated_prices + 1;
            end if;
          else
            insert into public.product_prices (product_id, unit_id, price)
              values (v_product_id, v_unit_id, v_price_value)
              returning id into v_price_id;

            v_imported_prices := v_imported_prices + 1;
          end if;
        end if;

        insert into public.adisyo_sync_mappings (
          business_id, provider, entity_type, external_id, local_table, local_id,
          first_seen_run_id, last_seen_run_id, first_seen_at, last_seen_at, is_active, source_payload
        )
        values (
          p_business_id, 'adisyo', 'product_price', v_price_external_id, 'product_prices', v_price_id,
          p_run_id, p_run_id, v_now, v_now, true, v_unit
        )
        on conflict (business_id, provider, entity_type, external_id)
        do update set
          local_table = excluded.local_table,
          local_id = excluded.local_id,
          last_seen_run_id = excluded.last_seen_run_id,
          last_seen_at = excluded.last_seen_at,
          is_active = true,
          source_payload = excluded.source_payload;
      end loop;
    end loop;
  end loop;

  for v_mapping in
    select id, local_id
      from public.adisyo_sync_mappings
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'product_price'
        and is_active = true
        and not (external_id = any(v_seen_prices))
  loop
    delete from public.product_prices where id = v_mapping.local_id;

    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where id = v_mapping.id;

    v_removed_prices := v_removed_prices + 1;
  end loop;

  for v_mapping in
    select id, local_id
      from public.adisyo_sync_mappings
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'product'
        and is_active = true
        and not (external_id = any(v_seen_products))
  loop
    update public.products
      set is_active = false,
          updated_at = v_now
      where id = v_mapping.local_id;

    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where id = v_mapping.id;

    v_archived_products := v_archived_products + 1;
  end loop;

  for v_mapping in
    select id, local_id
      from public.adisyo_sync_mappings
      where business_id = p_business_id
        and provider = 'adisyo'
        and entity_type = 'category'
        and is_active = true
        and not (external_id = any(v_seen_categories))
  loop
    update public.categories
      set is_active = false,
          updated_at = v_now
      where id = v_mapping.local_id;

    update public.adisyo_sync_mappings
      set is_active = false,
          last_seen_at = v_now
      where id = v_mapping.id;

    v_archived_categories := v_archived_categories + 1;
  end loop;

  return jsonb_build_object(
    'totalCategories', v_total_categories,
    'importedCategories', v_imported_categories,
    'updatedCategories', v_updated_categories,
    'archivedCategories', v_archived_categories,
    'reactivatedCategories', v_reactivated_categories,
    'totalProducts', v_total_products,
    'importedProducts', v_imported_products,
    'updatedProducts', v_updated_products,
    'archivedProducts', v_archived_products,
    'reactivatedProducts', v_reactivated_products,
    'importedPrices', v_imported_prices,
    'updatedPrices', v_updated_prices,
    'removedPrices', v_removed_prices,
    'failedItems', jsonb_build_object('categories', '[]'::jsonb, 'products', '[]'::jsonb)
  );
end;
$$;

revoke all on function public.sync_adisyo_products_snapshot(uuid, uuid, uuid, jsonb) from public;
revoke all on function public.sync_adisyo_products_snapshot(uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.sync_adisyo_products_snapshot(uuid, uuid, uuid, jsonb) from authenticated;
grant execute on function public.sync_adisyo_products_snapshot(uuid, uuid, uuid, jsonb) to service_role;
