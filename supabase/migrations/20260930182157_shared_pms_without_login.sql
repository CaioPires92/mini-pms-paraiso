create table public.shared_pms_state (
  id smallint primary key default 1 check (id = 1),
  accommodations jsonb not null default '[]'::jsonb,
  reservations jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_pms_state enable row level security;

create policy "Public PMS can read shared state"
on public.shared_pms_state for select
to anon, authenticated
using (id = 1);

create policy "Public PMS can insert shared state"
on public.shared_pms_state for insert
to anon, authenticated
with check (id = 1);

create policy "Public PMS can update shared state"
on public.shared_pms_state for update
to anon, authenticated
using (id = 1)
with check (id = 1);

grant select, insert, update on public.shared_pms_state to anon, authenticated;
