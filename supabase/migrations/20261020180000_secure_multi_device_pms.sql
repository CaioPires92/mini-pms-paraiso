-- New normalized, account-scoped PMS. Legacy state is deliberately preserved,
-- but no longer writable from the public client.
create schema if not exists private;

create table public.inns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null default 'Minha Pousada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inn_members (
  inn_id uuid not null references public.inns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (inn_id, user_id)
);

create table public.inn_settings (
  inn_id uuid primary key references public.inns(id) on delete cascade,
  inn_name text not null default 'Minha Pousada',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  default_checkin_time text not null default '14:00',
  default_checkout_time text not null default '12:00',
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pms_accommodations (
  id uuid primary key default gen_random_uuid(),
  inn_id uuid not null references public.inns(id) on delete cascade,
  nome text not null,
  tipo text not null,
  ativo boolean not null default true,
  sort_order integer not null default 0,
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, inn_id)
);

create table public.pms_reservations (
  id uuid primary key default gen_random_uuid(),
  inn_id uuid not null references public.inns(id) on delete cascade,
  accommodation_id uuid not null,
  guest_name text not null,
  document text,
  phone text,
  email text,
  vehicle_plate text,
  check_in date not null,
  check_out date not null,
  total_value numeric(12,2) not null check (total_value > 0),
  sales_channel text,
  payments jsonb not null default '[]'::jsonb,
  notes text,
  status text not null check (status in ('Reservada', 'Hospedado', 'Finalizada', 'Cancelada')),
  row_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  foreign key (accommodation_id, inn_id) references public.pms_accommodations(id, inn_id) on delete restrict
);

create index pms_accommodations_inn_sort_idx on public.pms_accommodations (inn_id, sort_order, created_at);
create index pms_reservations_inn_dates_idx on public.pms_reservations (inn_id, check_in, check_out);
create index pms_reservations_accommodation_dates_idx on public.pms_reservations (accommodation_id, check_in, check_out);

create table public.pms_audit_log (
  id bigint generated always as identity primary key,
  inn_id uuid not null references public.inns(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now()
);
create index pms_audit_log_inn_occurred_idx on public.pms_audit_log (inn_id, occurred_at desc);

create or replace function private.is_inn_member(target_inn_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.inn_members
    where inn_id = target_inn_id and user_id = (select auth.uid())
  );
$$;

create or replace function private.bootstrap_inn()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.inn_members (inn_id, user_id, role) values (new.id, new.owner_id, 'owner');
  insert into public.inn_settings (inn_id, inn_name) values (new.id, new.name);
  return new;
end;
$$;

create trigger inns_bootstrap_after_insert after insert on public.inns
for each row execute function private.bootstrap_inn();

create or replace function private.touch_pms_row()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  new.row_version = old.row_version + 1;
  return new;
end;
$$;

create or replace function private.audit_pms_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  row_inn_id uuid;
  row_id uuid;
begin
  row_inn_id := coalesce((to_jsonb(new)->>'inn_id')::uuid, (to_jsonb(old)->>'inn_id')::uuid);
  row_id := coalesce(
    (to_jsonb(new)->>'id')::uuid,
    (to_jsonb(old)->>'id')::uuid,
    (to_jsonb(new)->>'inn_id')::uuid,
    (to_jsonb(old)->>'inn_id')::uuid
  );
  insert into public.pms_audit_log (inn_id, actor_id, table_name, action, record_id, before_data, after_data)
  values (row_inn_id, auth.uid(), tg_table_name, tg_op, row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;

create trigger inn_settings_touch before update on public.inn_settings for each row execute function private.touch_pms_row();
create trigger pms_accommodations_touch before update on public.pms_accommodations for each row execute function private.touch_pms_row();
create trigger pms_reservations_touch before update on public.pms_reservations for each row execute function private.touch_pms_row();
create trigger inn_settings_audit after insert or update or delete on public.inn_settings for each row execute function private.audit_pms_change();
create trigger pms_accommodations_audit after insert or update or delete on public.pms_accommodations for each row execute function private.audit_pms_change();
create trigger pms_reservations_audit after insert or update or delete on public.pms_reservations for each row execute function private.audit_pms_change();

alter table public.inns enable row level security;
alter table public.inn_members enable row level security;
alter table public.inn_settings enable row level security;
alter table public.pms_accommodations enable row level security;
alter table public.pms_reservations enable row level security;
alter table public.pms_audit_log enable row level security;

create policy "members can read inns" on public.inns for select to authenticated using (private.is_inn_member(id));
create policy "users create their own inn" on public.inns for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "owners update inns" on public.inns for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "members read memberships" on public.inn_members for select to authenticated using (private.is_inn_member(inn_id));
create policy "members read settings" on public.inn_settings for select to authenticated using (private.is_inn_member(inn_id));
create policy "members update settings" on public.inn_settings for update to authenticated using (private.is_inn_member(inn_id)) with check (private.is_inn_member(inn_id));
create policy "members read accommodations" on public.pms_accommodations for select to authenticated using (private.is_inn_member(inn_id));
create policy "members create accommodations" on public.pms_accommodations for insert to authenticated with check (private.is_inn_member(inn_id));
create policy "members update accommodations" on public.pms_accommodations for update to authenticated using (private.is_inn_member(inn_id)) with check (private.is_inn_member(inn_id));
create policy "members delete accommodations" on public.pms_accommodations for delete to authenticated using (private.is_inn_member(inn_id));
create policy "members read reservations" on public.pms_reservations for select to authenticated using (private.is_inn_member(inn_id));
create policy "members create reservations" on public.pms_reservations for insert to authenticated with check (private.is_inn_member(inn_id));
create policy "members update reservations" on public.pms_reservations for update to authenticated using (private.is_inn_member(inn_id)) with check (private.is_inn_member(inn_id));
create policy "members delete reservations" on public.pms_reservations for delete to authenticated using (private.is_inn_member(inn_id));
create policy "members read audit" on public.pms_audit_log for select to authenticated using (private.is_inn_member(inn_id));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.inns, public.inn_members, public.inn_settings, public.pms_accommodations, public.pms_reservations, public.pms_audit_log to authenticated;
revoke all on function private.is_inn_member(uuid), private.bootstrap_inn(), private.touch_pms_row(), private.audit_pms_change() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_inn_member(uuid) to authenticated;

-- Keep historic evidence, but stop the old anonymous all-state overwrite path.
drop policy if exists "Public PMS can read shared state" on public.shared_pms_state;
drop policy if exists "Public PMS can insert shared state" on public.shared_pms_state;
drop policy if exists "Public PMS can update shared state" on public.shared_pms_state;
revoke all on public.shared_pms_state from anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inn_settings'
  ) then alter publication supabase_realtime add table public.inn_settings; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pms_accommodations'
  ) then alter publication supabase_realtime add table public.pms_accommodations; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pms_reservations'
  ) then alter publication supabase_realtime add table public.pms_reservations; end if;
end $$;
