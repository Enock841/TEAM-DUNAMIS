alter table business_settings add column if not exists booking_start_time text not null default '08:00';
alter table business_settings add column if not exists booking_end_time text not null default '18:00';
alter table business_settings add column if not exists booking_interval_minutes integer not null default 60;
