-- Idempotent: ensure cards.card_number exists (handles 011-only or missed 012).

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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cards'
      and column_name = 'number'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cards'
      and column_name = 'card_number'
  ) then
    alter table public.cards rename column number to card_number;
  end if;
end $$;

alter table public.cards
  add column if not exists card_number integer;

-- Backfill when card_number was just added or is still null.
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
set card_number = ranked.rn
from ranked
where c.id = ranked.id
  and c.card_number is null;

alter table public.boards
  add column if not exists key text,
  add column if not exists next_card_number integer not null default 0;

update public.boards b
set next_card_number = coalesce(
  (
    select max(c.card_number)
    from public.cards c
    join public.lists l on l.id = c.list_id
    where l.board_id = b.id
  ),
  0
)
where b.next_card_number = 0;

update public.boards b
set key = public.allocate_board_key(b.title, b.id)
where b.key is null;

drop index if exists public.cards_board_number_idx;
drop index if exists public.cards_board_card_number_idx;

create unique index if not exists cards_board_card_number_idx
  on public.cards (public.list_board_id(list_id), card_number);

create or replace function public.assign_card_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  board_id uuid;
begin
  if new.card_number is not null then
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
  returning next_card_number into new.card_number;

  return new;
end;
$$;

drop trigger if exists cards_assign_number on public.cards;

create trigger cards_assign_number
  before insert on public.cards
  for each row
  execute function public.assign_card_number();
