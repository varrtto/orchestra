-- Rename cards.number → card_number (clearer API; avoids client serialization issues).

alter table public.cards
  rename column number to card_number;

drop index if exists public.cards_board_number_idx;

create unique index cards_board_card_number_idx
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
