alter table reviews
  alter column booking_id drop not null;

alter table reviews
  add column if not exists updated_at timestamptz not null default now();

with ranked_reviews as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at desc, id desc
    ) as review_rank
  from reviews
)
delete from reviews
where id in (
  select id
  from ranked_reviews
  where review_rank > 1
);

create unique index if not exists reviews_user_id_unique
  on reviews (user_id);
