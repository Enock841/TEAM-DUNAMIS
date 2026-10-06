alter table payments add column if not exists method text not null default 'paystack';
alter table payments add column if not exists payer_name text;
alter table payments add column if not exists claimed_amount numeric(10,2);
alter table payments add column if not exists proof_image_url text;
alter table payments drop constraint if exists payments_status_check;
alter table payments add constraint payments_status_check check (status in ('pending', 'success', 'failed', 'awaiting_confirmation'));
alter table business_settings add column if not exists momo_network text not null default '';
alter table business_settings add column if not exists momo_number text not null default '';
alter table business_settings add column if not exists momo_account_name text not null default '';