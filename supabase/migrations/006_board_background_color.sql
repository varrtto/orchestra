alter table public.boards
  add column if not exists background_color text not null default '#0f3d3a';

alter table public.boards
  add constraint boards_background_color_hex_check
  check (background_color ~ '^#[0-9A-Fa-f]{6}$');
