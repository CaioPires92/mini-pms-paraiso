-- A narrow SECURITY DEFINER entry point avoids trusting a client-supplied owner id.
create or replace function public.create_inn_for_current_user()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_inn_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.inns (owner_id, name)
  values (auth.uid(), 'Minha Pousada')
  returning id into created_inn_id;

  return created_inn_id;
end;
$$;

revoke all on function public.create_inn_for_current_user() from public;
grant execute on function public.create_inn_for_current_user() to authenticated;
