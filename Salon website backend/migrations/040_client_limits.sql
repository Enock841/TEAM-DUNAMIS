alter table business_settings add column if not exists max_clients_per_day integer not null default 0;
create table if not exists day_limits (
  day date primary key,
  max_clients integer not null check (max_clients >= 1)
);
