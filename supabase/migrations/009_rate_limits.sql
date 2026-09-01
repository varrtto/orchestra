-- Per-user rate limits for board mutations and auth abuse prevention.

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_lookup_idx
  on public.rate_limit_events (user_id, action, created_at desc);

alter table public.rate_limit_events enable row level security;

create table public.auth_rate_limit_events (
  id bigint generated always as identity primary key,
  action text not null,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index auth_rate_limit_events_lookup_idx
  on public.auth_rate_limit_events (action, bucket_key, created_at desc);

alter table public.auth_rate_limit_events enable row level security;

revoke all on table public.rate_limit_events from public, anon, authenticated;
revoke all on table public.auth_rate_limit_events from public, anon, authenticated;

create or replace function public.assert_rate_limit(
  p_action text,
  p_max_count int,
  p_window_seconds int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  recent_count int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_max_count < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  delete from public.rate_limit_events
  where created_at < now() - make_interval(secs => p_window_seconds * 2);

  select count(*)::int
  into recent_count
  from public.rate_limit_events
  where user_id = uid
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_max_count then
    raise exception
      'Rate limit exceeded: too many requests for %. Please wait a minute and try again.',
      p_action
      using errcode = 'P0001';
  end if;

  insert into public.rate_limit_events (user_id, action)
  values (uid, p_action);
end;
$$;

create or replace function public.assert_auth_rate_limit(
  p_action text,
  p_bucket_key text,
  p_max_count int,
  p_window_seconds int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) = 0 then
    raise exception 'Invalid rate limit bucket';
  end if;

  if p_max_count < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  delete from public.auth_rate_limit_events
  where created_at < now() - make_interval(secs => p_window_seconds * 2);

  select count(*)::int
  into recent_count
  from public.auth_rate_limit_events
  where action = p_action
    and bucket_key = p_bucket_key
    and created_at > now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_max_count then
    raise exception
      'Too many attempts. Please wait before trying again.'
      using errcode = 'P0001';
  end if;

  insert into public.auth_rate_limit_events (action, bucket_key)
  values (p_action, p_bucket_key);
end;
$$;

revoke all on function public.assert_auth_rate_limit(text, text, int, int) from public;
grant execute on function public.assert_auth_rate_limit(text, text, int, int) to service_role;

create or replace function public.rate_limit_insert_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_rate_limit(
    TG_ARGV[0],
    TG_ARGV[1]::int,
    TG_ARGV[2]::int
  );
  return new;
end;
$$;

create trigger lists_rate_limit_insert
  before insert on public.lists
  for each row
  execute function public.rate_limit_insert_trigger('create_list', '20', '60');

create trigger cards_rate_limit_insert
  before insert on public.cards
  for each row
  execute function public.rate_limit_insert_trigger('create_card', '30', '60');

create trigger comments_rate_limit_insert
  before insert on public.comments
  for each row
  execute function public.rate_limit_insert_trigger('create_comment', '10', '60');

create trigger invites_rate_limit_insert
  before insert on public.invites
  for each row
  execute function public.rate_limit_insert_trigger('create_invite', '5', '60');

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

  perform public.assert_rate_limit('create_board', 5, 60);

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
