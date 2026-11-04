create table if not exists day_slots (
  day date primary key,
  times text[] not null
);
