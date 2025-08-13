-- 1) Add 'recurring' flag to bookings
alter table if exists public.bookings
  add column if not exists recurring boolean not null default false;

-- 2) Create recurring_bookings table for instance records
create table if not exists public.recurring_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  recurrence_type text not null check (recurrence_type in ('weekly','biweekly')),
  until date not null,
  day text not null,
  hour time not null,
  date date not null,
  status boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Indexes for faster lookups
create index if not exists idx_recurring_bookings_booking_id on public.recurring_bookings (booking_id);
create index if not exists idx_recurring_bookings_date on public.recurring_bookings (date);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_recurring_bookings_updated_at
before update on public.recurring_bookings
for each row execute function public.set_updated_at();
