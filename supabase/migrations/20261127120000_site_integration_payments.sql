-- Integração site x mini PMS: o pagamento feito no site passa a entrar em "Pagamentos recebidos".
-- Antes a reserva do site chegava com o valor total e ZERO recebido, e o dono via uma reserva em
-- aberto para um hóspede que já tinha pagado (achado em 27/11/2026).
--
-- `p_payments` é a lista do site no formato de `pms_reservations.payments`
-- ([{id, amount, method, type, paid_at, note}]). A gravação é um MERGE por `id`: o que foi lançado
-- à mão no PMS (saldo no check-in, por exemplo) NUNCA é apagado, e reenviar a mesma reserva
-- só atualiza as linhas do site.

create or replace function private.site_merge_payments(p_existing jsonb, p_incoming jsonb)
returns jsonb
language sql immutable set search_path = public as $$
  with incoming as (
    select e->>'id' as id,
           t.ord as ord,
           jsonb_build_object(
             'id', e->>'id',
             'amount', round((e->>'amount')::numeric, 2),
             'method', coalesce(nullif(trim(e->>'method'), ''), 'Outro'),
             'type', coalesce(nullif(trim(e->>'type'), ''), 'Pagamento'),
             'paid_at', e->>'paid_at',
             'note', nullif(trim(coalesce(e->>'note', '')), '')
           ) as item
    from jsonb_array_elements(coalesce(p_incoming, '[]'::jsonb)) with ordinality as t(e, ord)
    where nullif(trim(coalesce(e->>'id', '')), '') is not null
      and coalesce(e->>'amount', '') ~ '^[0-9]+(\.[0-9]+)?$'
      and (e->>'amount')::numeric > 0
      and coalesce(e->>'paid_at', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  ),
  kept as (
    select t.ord as ord, e as item
    from jsonb_array_elements(coalesce(p_existing, '[]'::jsonb)) with ordinality as t(e, ord)
    where coalesce(e->>'id', '') not in (select id from incoming)
  )
  select coalesce(jsonb_agg(item order by src, ord), '[]'::jsonb)
  from (
    select item, ord, 0 as src from kept
    union all
    select item, ord, 1 as src from incoming
  ) merged;
$$;

drop function if exists public.site_upsert_reservation(text, text, text, text, text, text, date, date, numeric, boolean, text);

create or replace function public.site_upsert_reservation(
  p_secret text,
  p_site_booking_id text,
  p_room_type text,
  p_guest_name text,
  p_phone text,
  p_email text,
  p_check_in date,
  p_check_out date,
  p_total_value numeric,
  p_cancelled boolean default false,
  p_notes text default null,
  p_payments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql security definer set search_path = public, private as $$
declare
  v_inn uuid;
  v_existing public.pms_reservations%rowtype;
  v_acc uuid;
  v_id uuid;
  v_status text;
  v_payments jsonb;
begin
  perform private.assert_site_secret(p_secret);
  if p_site_booking_id is null or length(trim(p_site_booking_id)) = 0 then
    raise exception 'invalid_site_booking_id' using errcode = '22023';
  end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'invalid_range' using errcode = '22023';
  end if;
  if p_payments is not null and jsonb_typeof(p_payments) <> 'array' then
    raise exception 'invalid_payments' using errcode = '22023';
  end if;

  -- Serializa a escolha de Unidade por tipo (evita duas reservas escolherem a mesma Unidade).
  perform pg_advisory_xact_lock(hashtext('site_upsert_reservation:' || coalesce(p_room_type, '')));

  select * into v_existing from public.pms_reservations where site_booking_id = p_site_booking_id;

  if found then
    if p_cancelled then
      update public.pms_reservations set status = 'Cancelada' where id = v_existing.id and status <> 'Cancelada';
      return v_existing.id;
    end if;
    v_payments := private.site_merge_payments(v_existing.payments, p_payments);
    -- Mesma estadia: só acerta o pagamento (e o valor), sem realocar nada.
    if v_existing.check_in = p_check_in and v_existing.check_out = p_check_out and v_existing.status <> 'Cancelada' then
      update public.pms_reservations
         set total_value = p_total_value, payments = v_payments
       where id = v_existing.id
         and (total_value <> p_total_value or payments <> v_payments);
      return v_existing.id;
    end if;
    -- Datas mudaram (ou estava cancelada): realoca, mantendo a mesma Unidade se estiver livre.
    select a.id into v_acc
    from public.pms_accommodations a
    where a.inn_id = v_existing.inn_id and a.ativo
      and private.accommodation_room_type(a.nome) = p_room_type
      and not exists (
        select 1 from public.pms_reservations r
        where r.accommodation_id = a.id and r.id <> v_existing.id and r.status <> 'Cancelada'
          and r.check_in < p_check_out and r.check_out > p_check_in
      )
    order by (a.id = v_existing.accommodation_id) desc, a.sort_order
    limit 1;
    if v_acc is null then raise exception 'sem_unidade_livre' using errcode = 'P0001'; end if;
    update public.pms_reservations
       set accommodation_id = v_acc, check_in = p_check_in, check_out = p_check_out,
           total_value = p_total_value, status = 'Reservada', payments = v_payments
     where id = v_existing.id;
    return v_existing.id;
  end if;

  if p_cancelled then return null; end if; -- cancelou antes de existir no PMS

  select a.inn_id, a.id into v_inn, v_acc
  from public.pms_accommodations a
  where a.ativo and private.accommodation_room_type(a.nome) = p_room_type
    and not exists (
      select 1 from public.pms_reservations r
      where r.accommodation_id = a.id and r.status <> 'Cancelada'
        and r.check_in < p_check_out and r.check_out > p_check_in
    )
  order by a.sort_order
  limit 1;
  if v_acc is null then raise exception 'sem_unidade_livre' using errcode = 'P0001'; end if;

  v_status := case
    when (now() at time zone 'America/Sao_Paulo')::date < p_check_in then 'Reservada'
    when (now() at time zone 'America/Sao_Paulo')::date < p_check_out then 'Hospedado'
    else 'Finalizada' end;

  insert into public.pms_reservations
    (inn_id, accommodation_id, guest_name, phone, email, check_in, check_out, total_value,
     sales_channel, notes, status, site_booking_id, payments)
  values
    (v_inn, v_acc, coalesce(nullif(trim(p_guest_name), ''), 'Hóspede do site'), nullif(trim(p_phone), ''),
     nullif(trim(p_email), ''), p_check_in, p_check_out, p_total_value, 'Site',
     concat_ws(' | ', 'Reserva do site #' || p_site_booking_id, nullif(trim(p_notes), '')),
     v_status, p_site_booking_id, private.site_merge_payments('[]'::jsonb, p_payments))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.site_upsert_reservation(text, text, text, text, text, text, date, date, numeric, boolean, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.site_upsert_reservation(text, text, text, text, text, text, date, date, numeric, boolean, text, jsonb)
  to anon;
