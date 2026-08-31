-- Orchest schema: boards, lists, cards, labels, comments, members, invites

create extension if not exists "pgcrypto";

-- Profiles (mirrors auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.board_members (
  board_id uuid not null references public.boards (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date timestamptz,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  name text not null,
  color text not null default '#0d9488'
);

create table public.card_labels (
  card_id uuid not null references public.cards (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  primary key (card_id, label_id)
);

create table public.card_assignees (
  card_id uuid not null references public.cards (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (card_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (board_id, email)
);

create index lists_board_position_idx on public.lists (board_id, position);
create index cards_list_position_idx on public.cards (list_id, position);
create index comments_card_created_idx on public.comments (card_id, created_at);
create index invites_email_status_idx on public.invites (email, status);
create index board_members_user_idx on public.board_members (user_id);

-- Helpers (security definer to avoid RLS recursion)
create or replace function public.is_board_member(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.board_members
    where board_id = p_board_id and user_id = auth.uid()
  );
$$;

create or replace function public.board_member_role(p_board_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.board_members
  where board_id = p_board_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_edit_board(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.board_members
    where board_id = p_board_id
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

create or replace function public.list_board_id(p_list_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select board_id from public.lists where id = p_list_id;
$$;

create or replace function public.card_board_id(p_card_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select l.board_id
  from public.cards c
  join public.lists l on l.id = c.list_id
  where c.id = p_card_id;
$$;

-- Profile on signup
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
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Claim pending invites for current user
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

-- Create board + owner membership
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

  insert into public.boards (title, created_by)
  values (p_title, auth.uid())
  returning * into new_board;

  insert into public.board_members (board_id, user_id, role)
  values (new_board.id, auth.uid(), 'owner');

  -- Default labels
  insert into public.labels (board_id, name, color) values
    (new_board.id, 'Bug', '#ef4444'),
    (new_board.id, 'Feature', '#0d9488'),
    (new_board.id, 'Chore', '#f59e0b');

  return new_board;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.lists enable row level security;
alter table public.cards enable row level security;
alter table public.labels enable row level security;
alter table public.card_labels enable row level security;
alter table public.card_assignees enable row level security;
alter table public.comments enable row level security;
alter table public.invites enable row level security;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

-- Boards
create policy "Members can view boards"
  on public.boards for select to authenticated
  using (public.is_board_member(id));

create policy "Authenticated users create boards via RPC"
  on public.boards for insert to authenticated
  with check (created_by = auth.uid());

create policy "Editors can update boards"
  on public.boards for update to authenticated
  using (public.can_edit_board(id));

create policy "Owners can delete boards"
  on public.boards for delete to authenticated
  using (public.board_member_role(id) = 'owner');

-- Board members
create policy "Members can view membership"
  on public.board_members for select to authenticated
  using (public.is_board_member(board_id) or user_id = auth.uid());

create policy "Owners can insert members"
  on public.board_members for insert to authenticated
  with check (
    public.board_member_role(board_id) = 'owner'
    or (user_id = auth.uid() and role = 'owner') -- create_board path
  );

create policy "Owners can update members"
  on public.board_members for update to authenticated
  using (public.board_member_role(board_id) = 'owner');

create policy "Owners can remove members or self-leave"
  on public.board_members for delete to authenticated
  using (
    public.board_member_role(board_id) = 'owner'
    or user_id = auth.uid()
  );

-- Lists
create policy "Members can view lists"
  on public.lists for select to authenticated
  using (public.is_board_member(board_id));

create policy "Editors can insert lists"
  on public.lists for insert to authenticated
  with check (public.can_edit_board(board_id));

create policy "Editors can update lists"
  on public.lists for update to authenticated
  using (public.can_edit_board(board_id));

create policy "Editors can delete lists"
  on public.lists for delete to authenticated
  using (public.can_edit_board(board_id));

-- Cards
create policy "Members can view cards"
  on public.cards for select to authenticated
  using (public.is_board_member(public.list_board_id(list_id)));

create policy "Editors can insert cards"
  on public.cards for insert to authenticated
  with check (public.can_edit_board(public.list_board_id(list_id)));

create policy "Editors can update cards"
  on public.cards for update to authenticated
  using (public.can_edit_board(public.list_board_id(list_id)));

create policy "Editors can delete cards"
  on public.cards for delete to authenticated
  using (public.can_edit_board(public.list_board_id(list_id)));

-- Labels
create policy "Members can view labels"
  on public.labels for select to authenticated
  using (public.is_board_member(board_id));

create policy "Editors can insert labels"
  on public.labels for insert to authenticated
  with check (public.can_edit_board(board_id));

create policy "Editors can update labels"
  on public.labels for update to authenticated
  using (public.can_edit_board(board_id));

create policy "Editors can delete labels"
  on public.labels for delete to authenticated
  using (public.can_edit_board(board_id));

-- Card labels
create policy "Members can view card labels"
  on public.card_labels for select to authenticated
  using (public.is_board_member(public.card_board_id(card_id)));

create policy "Editors can insert card labels"
  on public.card_labels for insert to authenticated
  with check (public.can_edit_board(public.card_board_id(card_id)));

create policy "Editors can delete card labels"
  on public.card_labels for delete to authenticated
  using (public.can_edit_board(public.card_board_id(card_id)));

-- Card assignees
create policy "Members can view assignees"
  on public.card_assignees for select to authenticated
  using (public.is_board_member(public.card_board_id(card_id)));

create policy "Editors can insert assignees"
  on public.card_assignees for insert to authenticated
  with check (public.can_edit_board(public.card_board_id(card_id)));

create policy "Editors can delete assignees"
  on public.card_assignees for delete to authenticated
  using (public.can_edit_board(public.card_board_id(card_id)));

-- Comments
create policy "Members can view comments"
  on public.comments for select to authenticated
  using (public.is_board_member(public.card_board_id(card_id)));

create policy "Editors can insert comments"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_edit_board(public.card_board_id(card_id))
  );

create policy "Authors can update own comments"
  on public.comments for update to authenticated
  using (author_id = auth.uid());

create policy "Authors or editors can delete comments"
  on public.comments for delete to authenticated
  using (
    author_id = auth.uid()
    or public.can_edit_board(public.card_board_id(card_id))
  );

-- Invites
create policy "Members can view invites"
  on public.invites for select to authenticated
  using (
    public.is_board_member(board_id)
    or lower(email) = lower((select email from public.profiles where id = auth.uid()))
  );

create policy "Editors can create invites"
  on public.invites for insert to authenticated
  with check (
    public.can_edit_board(board_id)
    and invited_by = auth.uid()
    and role <> 'owner'
  );

create policy "Editors can update invites"
  on public.invites for update to authenticated
  using (public.can_edit_board(board_id));

create policy "Editors can delete invites"
  on public.invites for delete to authenticated
  using (public.can_edit_board(board_id));

grant execute on function public.create_board(text) to authenticated;
grant execute on function public.claim_invites() to authenticated;
grant execute on function public.is_board_member(uuid) to authenticated;
grant execute on function public.board_member_role(uuid) to authenticated;
grant execute on function public.can_edit_board(uuid) to authenticated;

-- Realtime
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.labels;
alter publication supabase_realtime add table public.card_labels;
alter publication supabase_realtime add table public.card_assignees;
alter publication supabase_realtime add table public.board_members;
