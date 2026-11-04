create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null default '',
  contact text not null default '',
  rating int not null check (rating between 1 and 5),
  message text not null default '',
  page text not null default '',
  created_at timestamptz not null default now()
);
