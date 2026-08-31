-- Backfill profiles for users created before the signup trigger ran
insert into public.profiles (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Ensure the current user has a profile row (idempotent)
create or replace function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  user_row auth.users;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();
  if found then
    return profile_row;
  end if;

  select * into user_row from auth.users where id = auth.uid();
  if not found then
    raise exception 'User not found';
  end if;

  insert into public.profiles (id, email, display_name)
  values (
    user_row.id,
    user_row.email,
    coalesce(user_row.raw_user_meta_data->>'display_name', split_part(user_row.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email
  returning * into profile_row;

  return profile_row;
end;
$$;

-- Harden signup trigger against duplicate inserts
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Claim invites only after profile exists
create or replace function public.claim_invites()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed int := 0;
  inv record;
  user_email text;
begin
  perform public.ensure_profile();

  select email into user_email from public.profiles where id = auth.uid();
  if user_email is null then
    return 0;
  end if;

  for inv in
    select * from public.invites
    where lower(email) = lower(user_email)
      and status = 'pending'
  loop
    insert into public.board_members (board_id, user_id, role)
    values (inv.board_id, auth.uid(), inv.role)
    on conflict (board_id, user_id) do nothing;

    update public.invites
    set status = 'accepted'
    where id = inv.id;

    claimed := claimed + 1;
  end loop;

  return claimed;
end;
$$;

-- Create board only after profile exists
create or replace function public.create_board(p_title text)
returns public.boards
language plpgsql
security definer
set search_path = public
as $$
declare
  new_board public.boards;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_profile();

  insert into public.boards (title, created_by)
  values (p_title, auth.uid())
  returning * into new_board;

  insert into public.board_members (board_id, user_id, role)
  values (new_board.id, auth.uid(), 'owner');

  insert into public.labels (board_id, name, color) values
    (new_board.id, 'Bug', '#ef4444'),
    (new_board.id, 'Feature', '#0d9488'),
    (new_board.id, 'Chore', '#f59e0b');

  return new_board;
end;
$$;

grant execute on function public.ensure_profile() to authenticated;
