-- Upsert pending invites (re-invite same email) and revoke stale ones.

create or replace function public.upsert_board_invite(
  p_board_id uuid,
  p_email text,
  p_role text
)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(p_email));
  existing public.invites;
  result public.invites;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_edit_board(p_board_id) then
    raise exception 'Not allowed to invite members';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'Invalid role';
  end if;

  if normalized_email is null
    or normalized_email = ''
    or normalized_email !~ '^[^@]+@[^@]+\.[^@]+$'
  then
    raise exception 'Invalid email address';
  end if;

  if exists (
    select 1
    from public.profiles p
    join public.board_members bm on bm.user_id = p.id
    where bm.board_id = p_board_id
      and lower(p.email) = normalized_email
  ) then
    raise exception 'This person is already a member of this board';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(email) = normalized_email
  ) then
    raise exception 'You are already on this board';
  end if;

  select *
  into existing
  from public.invites
  where board_id = p_board_id
    and lower(email) = normalized_email;

  if found then
    if existing.status = 'accepted' then
      raise exception 'This person already joined the board';
    end if;

    update public.invites
    set
      role = p_role,
      status = 'pending',
      invited_by = auth.uid(),
      created_at = now()
    where id = existing.id
    returning * into result;

    return result;
  end if;

  perform public.assert_rate_limit('create_invite', 5, 60);

  insert into public.invites (board_id, email, role, status, invited_by)
  values (p_board_id, normalized_email, p_role, 'pending', auth.uid())
  returning * into result;

  return result;
end;
$$;

create or replace function public.revoke_board_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invites;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.invites where id = p_invite_id;
  if not found then
    raise exception 'Invite not found';
  end if;

  if not public.can_edit_board(inv.board_id) then
    raise exception 'Not allowed to revoke this invite';
  end if;

  if inv.status <> 'pending' then
    raise exception 'Only pending invites can be revoked';
  end if;

  update public.invites
  set status = 'revoked'
  where id = p_invite_id;
end;
$$;

grant execute on function public.upsert_board_invite(uuid, text, text) to authenticated;
grant execute on function public.revoke_board_invite(uuid) to authenticated;
