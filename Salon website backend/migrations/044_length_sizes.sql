create table if not exists length_size_options (
  id uuid primary key default gen_random_uuid(),
  length_option_id uuid not null references service_length_options(id) on delete cascade,
  label text not null,
  price numeric(10, 2) not null check (price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
