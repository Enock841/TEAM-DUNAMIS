create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_resets_user_idx on password_resets(user_id);

create table if not exists days_off (
  day date primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists closed_weekdays (
  weekday integer primary key check (weekday between 0 and 6)
);

insert into closed_weekdays (weekday) values (0) on conflict do nothing;