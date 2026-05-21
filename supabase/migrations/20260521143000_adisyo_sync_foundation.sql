create table if not exists public.adisyo_sync_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  menu_id uuid references public.menus(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  trigger text not null default 'manual' check (trigger in ('manual', 'scheduled', 'webhook', 'system')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  totals jsonb not null default '{}'::jsonb,
  error text,
  created_by uuid
);

create table if not exists public.adisyo_sync_state (
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null default 'adisyo',
  endpoint text not null,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_allowed_at timestamptz,
  last_status text,
  last_error text,
  last_run_id uuid references public.adisyo_sync_runs(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (business_id, provider, endpoint)
);

create table if not exists public.adisyo_sync_mappings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null default 'adisyo',
  entity_type text not null check (entity_type in ('menu', 'category', 'product', 'product_price')),
  external_id text not null,
  local_table text not null,
  local_id uuid not null,
  first_seen_run_id uuid references public.adisyo_sync_runs(id) on delete set null,
  last_seen_run_id uuid references public.adisyo_sync_runs(id) on delete set null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  source_payload jsonb not null default '{}'::jsonb,
  unique (business_id, provider, entity_type, external_id)
);

create table if not exists public.adisyo_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null default 'adisyo',
  restaurant_identity text,
  api_key text not null,
  api_secret text not null,
  api_consumer text not null,
  is_active boolean not null default true,
  last_verified_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create table if not exists public.adisyo_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  business_id uuid references public.businesses(id) on delete set null,
  restaurant_identity text,
  event_type text not null,
  event_time_utc timestamptz,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index if not exists adisyo_sync_runs_business_started_idx
  on public.adisyo_sync_runs (business_id, started_at desc);

create index if not exists adisyo_sync_runs_menu_idx
  on public.adisyo_sync_runs (menu_id)
  where menu_id is not null;

create index if not exists adisyo_sync_state_last_run_idx
  on public.adisyo_sync_state (last_run_id)
  where last_run_id is not null;

create index if not exists adisyo_sync_mappings_local_idx
  on public.adisyo_sync_mappings (local_table, local_id);

create index if not exists adisyo_sync_mappings_first_run_idx
  on public.adisyo_sync_mappings (first_seen_run_id)
  where first_seen_run_id is not null;

create index if not exists adisyo_sync_mappings_last_run_idx
  on public.adisyo_sync_mappings (last_seen_run_id)
  where last_seen_run_id is not null;

create index if not exists adisyo_sync_mappings_active_idx
  on public.adisyo_sync_mappings (business_id, entity_type, is_active)
  where is_active = true;

create index if not exists adisyo_connections_business_active_idx
  on public.adisyo_connections (business_id, provider, is_active)
  where is_active = true;

create index if not exists adisyo_webhook_events_type_received_idx
  on public.adisyo_webhook_events (event_type, received_at desc);

create index if not exists adisyo_webhook_events_business_received_idx
  on public.adisyo_webhook_events (business_id, received_at desc)
  where business_id is not null;

create index if not exists business_users_business_user_idx
  on public.business_users (business_id, user_id);

alter table public.adisyo_sync_runs enable row level security;
alter table public.adisyo_sync_state enable row level security;
alter table public.adisyo_sync_mappings enable row level security;
alter table public.adisyo_connections enable row level security;
alter table public.adisyo_webhook_events enable row level security;

drop policy if exists "business members can read adisyo sync runs" on public.adisyo_sync_runs;
create policy "business members can read adisyo sync runs"
  on public.adisyo_sync_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_runs.business_id
        and bu.user_id = (select auth.uid())
    )
  );

drop policy if exists "business members can manage adisyo sync runs" on public.adisyo_sync_runs;
create policy "business members can manage adisyo sync runs"
  on public.adisyo_sync_runs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_runs.business_id
        and bu.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_runs.business_id
        and bu.user_id = (select auth.uid())
    )
  );

drop policy if exists "business members can read adisyo sync state" on public.adisyo_sync_state;
create policy "business members can read adisyo sync state"
  on public.adisyo_sync_state
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_state.business_id
        and bu.user_id = (select auth.uid())
    )
  );

drop policy if exists "business members can manage adisyo sync state" on public.adisyo_sync_state;
create policy "business members can manage adisyo sync state"
  on public.adisyo_sync_state
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_state.business_id
        and bu.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_state.business_id
        and bu.user_id = (select auth.uid())
    )
  );

drop policy if exists "business members can read adisyo mappings" on public.adisyo_sync_mappings;
create policy "business members can read adisyo mappings"
  on public.adisyo_sync_mappings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_mappings.business_id
        and bu.user_id = (select auth.uid())
    )
  );

drop policy if exists "business members can manage adisyo mappings" on public.adisyo_sync_mappings;
create policy "business members can manage adisyo mappings"
  on public.adisyo_sync_mappings
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_mappings.business_id
        and bu.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.business_users bu
      where bu.business_id = adisyo_sync_mappings.business_id
        and bu.user_id = (select auth.uid())
    )
  );
