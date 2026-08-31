-- Keep boards.updated_at fresh when board content changes (for sort order on /boards)

create or replace function public.touch_board(p_board_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.boards
  set updated_at = now()
  where id = p_board_id;
$$;

create or replace function public.touch_board_from_list()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.touch_board(coalesce(new.board_id, old.board_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.touch_board_from_card()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select l.board_id into v_board_id
  from public.lists l
  where l.id = coalesce(new.list_id, old.list_id);

  if v_board_id is not null then
    perform public.touch_board(v_board_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_board_from_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select l.board_id into v_board_id
  from public.cards c
  join public.lists l on l.id = c.list_id
  where c.id = coalesce(new.card_id, old.card_id);

  if v_board_id is not null then
    perform public.touch_board(v_board_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.touch_board_from_card_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  select l.board_id into v_board_id
  from public.cards c
  join public.lists l on l.id = c.list_id
  where c.id = coalesce(new.card_id, old.card_id);

  if v_board_id is not null then
    perform public.touch_board(v_board_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.set_board_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lists_touch_board
  after insert or update or delete on public.lists
  for each row execute function public.touch_board_from_list();

create trigger cards_touch_board
  after insert or update or delete on public.cards
  for each row execute function public.touch_board_from_card();

create trigger comments_touch_board
  after insert or update or delete on public.comments
  for each row execute function public.touch_board_from_comment();

create trigger card_labels_touch_board
  after insert or delete on public.card_labels
  for each row execute function public.touch_board_from_card_child();

create trigger card_assignees_touch_board
  after insert or delete on public.card_assignees
  for each row execute function public.touch_board_from_card_child();

create trigger labels_touch_board
  after insert or update or delete on public.labels
  for each row execute function public.touch_board_from_list();

create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_board_updated_at();

create index if not exists boards_updated_at_idx on public.boards (updated_at desc);
