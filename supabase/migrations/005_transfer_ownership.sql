-- Atomic board ownership transfer (current user must be owner)
create or replace function public.transfer_board_ownership(
  p_board_id uuid,
  p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_new_owner_id = auth.uid() then
    raise exception 'Already the owner';
  end if;

  if public.board_member_role(p_board_id) <> 'owner' then
    raise exception 'Only the owner can transfer ownership';
  end if;

  if not exists (
    select 1 from public.board_members
    where board_id = p_board_id and user_id = p_new_owner_id
  ) then
    raise exception 'New owner must be a board member';
  end if;

  update public.board_members
  set role = 'editor'
  where board_id = p_board_id and user_id = auth.uid();

  update public.board_members
  set role = 'owner'
  where board_id = p_board_id and user_id = p_new_owner_id;
end;
$$;

grant execute on function public.transfer_board_ownership(uuid, uuid) to authenticated;
