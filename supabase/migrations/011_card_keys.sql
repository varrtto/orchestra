-- Human-readable card identifiers per board (e.g. ORFEO-00003).

alter table public.boards
  add column key text,
  add column next_card_number integer not null default 0;

alter table public.cards
  add column number integer;

create or replace function public.board_key_from_title(p_title text)
returns text
language sql
immutable
as $$
  select case
    when length(upper(regexp_replace(coalesce(p_title, ''), '[^a-zA-Z0-9]', '', 'g'))) = 0
      then 'BOARD'
    else left(
      upper(regexp_replace(coalesce(p_title, ''), '[^a-zA-Z0-9]', '', 'g')),
      12
    )
  end;
$$;

create or replace function public.allocate_board_key(
  p_title text,
  p_exclude_board_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := public.board_key_from_title(p_title);
  candidate text := base;
  suffix int := 0;
begin
  while exists (
    select 1
    from public.boards
    where key = candidate
      and (p_exclude_board_id is null or id <> p_exclude_board_id)
  ) loop
    suffix := suffix + 1;
    candidate := base || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.assign_card_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  board_id uuid;
begin
  if new.number is not null then
    return new;
  end if;

  select l.board_id
  into board_id
  from public.lists l
  where l.id = new.list_id;

  if board_id is null then
    raise exception 'List not found';
  end if;

  update public.boards
  set next_card_number = next_card_number + 1
  where id = board_id
  returning next_card_number into new.number;

  return new;
end;
$$;

-- Backfill card numbers by creation order within each board.
with ranked as (
  select
    c.id,
    row_number() over (
      partition by l.board_id
      order by c.created_at, c.id
    )::int as rn
  from public.cards c
  join public.lists l on l.id = c.list_id
)
update public.cards c
set number = ranked.rn
from ranked
where c.id = ranked.id;

update public.boards b
set next_card_number = coalesce(
  (
    select max(c.number)
    from public.cards c
    join public.lists l on l.id = c.list_id
    where l.board_id = b.id
  ),
  0
);

update public.boards b
set key = public.allocate_board_key(b.title, b.id)
where b.key is null;

alter table public.boards
  alter column key set not null;

alter table public.cards
  alter column number set not null;

create unique index cards_board_number_idx
  on public.cards (public.list_board_id(list_id), number);

create trigger cards_assign_number
  before insert on public.cards
  for each row
  execute function public.assign_card_number();

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
  board_key text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_rate_limit('create_board', 5, 60);

  if color !~ '^#[0-9A-Fa-f]{6}$' then
    color := '#0f3d3a';
  end if;

  perform public.ensure_profile();

  board_key := public.allocate_board_key(p_title);

  insert into public.boards (title, created_by, background_color, key)
  values (p_title, auth.uid(), color, board_key)
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

grant execute on function public.allocate_board_key(text, uuid) to authenticated;
