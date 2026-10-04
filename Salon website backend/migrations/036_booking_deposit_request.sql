alter table bookings add column if not exists deposit_request_amount numeric(10,2);
alter table bookings add column if not exists deposit_request_note text;