-- Assign background color when creating a board
drop function if exists public.create_board(text);

create or replace function public.create_board(
  p_title text,
  p_background_color text default '#0f3d3a'
)
returns public.boards
language plpgsql
security definer
set search_path = public
as $$
declare
  new_board public.boards;
  color text := p_background_color;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if color !~ '^#[0-9A-Fa-f]{6}$' then
    color := '#0f3d3a';
  end if;

  perform public.ensure_profile();

  insert into public.boards (title, created_by, background_color)
  values (p_title, auth.uid(), color)
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

grant execute on function public.create_board(text, text) to authenticated;
