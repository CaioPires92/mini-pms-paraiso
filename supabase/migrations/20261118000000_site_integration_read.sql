-- Integração site x mini PMS, FASE 1 (leitura).
-- O site (Pousada Paraíso) consulta quantas Unidades o PMS já ocupa por tipo e por noite,
-- sem acesso a nenhum dado de hóspede. Nada aqui altera reservas existentes.
--
-- Regra anti-duplicidade: reserva do PMS com `site_booking_id` preenchido É a mesma reserva
-- que o site já conta na própria base, então fica FORA desta contagem. Reserva sem esse campo
-- (WhatsApp, Booking, lançamento manual) só existe no PMS e entra na contagem.

-- 1) Marca de ligação com a reserva do site (id da Booking do site).
alter table public.pms_reservations add column if not exists site_booking_id text;
create unique index if not exists pms_reservations_site_booking_id_key
  on public.pms_reservations (site_booking_id) where site_booking_id is not null;

-- 2) Segredo compartilhado: o site envia o segredo, o banco guarda só o hash.
--    Sem RLS policy = ninguém lê pela API; só as funções security definer abaixo.
create schema if not exists private;
create table if not exists private.site_integration (
  id boolean primary key default true check (id),
  secret_hash text not null,
  updated_at timestamptz not null default now()
);
alter table private.site_integration enable row level security;
revoke all on private.site_integration from anon, authenticated;

create or replace function private.assert_site_secret(p_secret text)
returns void language plpgsql security definer set search_path = private, public as $$
begin
  if p_secret is null or not exists (
    select 1 from private.site_integration
    where secret_hash = encode(sha256(convert_to(p_secret, 'utf8')), 'hex')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.assert_site_secret(text) from public, anon, authenticated;

-- 3) Nome da acomodação -> id do Tipo de Acomodação do site.
--    Familiar 1-5 = Família, Casal 6-10 = Casal, Suíte 16/18/20 = Suíte (a 16, PCD, conta como Suíte).
create or replace function private.accommodation_room_type(p_nome text)
returns text language sql immutable as $$
  select case
    when p_nome ilike 'Chalé Familiar%' then 'chale-familia'
    when p_nome ilike 'Chalé Casal%'    then 'chale-casal'
    when p_nome ilike 'Suíte%'          then 'chale-suite'
  end;
$$;
revoke all on function private.accommodation_room_type(text) from public, anon, authenticated;

-- 4) Ocupação do PMS por tipo e noite. Noites de p_from até p_to - 1 (p_to é a saída, não conta).
--    Retorna só números. Ignora Cancelada e reservas ligadas ao site.
create or replace function public.site_occupancy(p_secret text, p_from date, p_to date)
returns table (room_type text, night date, occupied integer)
language plpgsql stable security definer set search_path = public, private as $$
begin
  perform private.assert_site_secret(p_secret);
  if p_from is null or p_to is null or p_to <= p_from or p_to - p_from > 800 then
    raise exception 'invalid_range' using errcode = '22023';
  end if;

  return query
  select t.rt, t.n, count(*)::integer
  from (
    select private.accommodation_room_type(a.nome) as rt,
           greatest(r.check_in, p_from) + g as n
    from public.pms_reservations r
    join public.pms_accommodations a on a.id = r.accommodation_id and a.inn_id = r.inn_id
    cross join lateral generate_series(0, least(r.check_out, p_to) - greatest(r.check_in, p_from) - 1) as g
    where r.status <> 'Cancelada'
      and r.site_booking_id is null
      and r.check_in < p_to
      and r.check_out > p_from
  ) t
  where t.rt is not null
  group by t.rt, t.n
  order by t.n, t.rt;
end;
$$;
revoke all on function public.site_occupancy(text, date, date) from public, anon, authenticated;
grant execute on function public.site_occupancy(text, date, date) to anon;

-- 5) CONFIGURAR O SEGREDO (rode UMA vez, à mão, com um segredo seu; NÃO commite o segredo):
--    gere com:  openssl rand -hex 32
--    insert into private.site_integration (secret_hash)
--    values (encode(sha256(convert_to('COLE_O_SEGREDO_AQUI', 'utf8')), 'hex'))
--    on conflict (id) do update set secret_hash = excluded.secret_hash, updated_at = now();
--    O mesmo segredo vai para a Vercel do site como PMS_SITE_SECRET.
