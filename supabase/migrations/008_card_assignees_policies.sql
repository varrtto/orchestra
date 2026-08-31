-- Clarify assignee policies: owners and editors may add/remove any assignee
drop policy if exists "Editors can insert assignees" on public.card_assignees;
drop policy if exists "Editors can delete assignees" on public.card_assignees;

create policy "Owners and editors can insert assignees"
  on public.card_assignees for insert to authenticated
  with check (public.can_edit_board(public.card_board_id(card_id)));

create policy "Owners and editors can delete assignees"
  on public.card_assignees for delete to authenticated
  using (public.can_edit_board(public.card_board_id(card_id)));
