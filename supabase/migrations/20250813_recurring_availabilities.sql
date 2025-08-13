-- Recurring availabilities to block slots on a recurring basis
-- Creates parent table and links child instances via FK from public.availabilities

-- Ensure extensions
create extension if not exists pgcrypto;

-- Updated-at trigger function (idempotent)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Parent table: recurring_availabilities
create table if not exists public.recurring_availabilities (
  id uuid primary key default gen_random_uuid(),
  recurrence_type text not null check (recurrence_type in ('daily','weekly','biweekly')),
  weekdays int[] null, -- for weekly/biweekly (0..6, where 0=Sunday if you choose), otherwise null
  hour time not null,
  start_date date not null,
  until date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Indexes for querying
create index if not exists idx_rec_avail_start_date on public.recurring_availabilities (start_date);
create index if not exists idx_rec_avail_until on public.recurring_availabilities (until);
create index if not exists idx_rec_avail_hour on public.recurring_availabilities (hour);


-- Trigger to maintain updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_recurring_availabilities_updated_at'
  ) then
    create trigger trg_recurring_availabilities_updated_at
    before update on public.recurring_availabilities
    for each row execute function public.set_updated_at();
  end if;
end$$;

-- Add FK column on child table to support cascade deletion of generated instances
alter table public.availabilities
  add column if not exists recurring_availability_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.availabilities'::regclass
      and conname = 'availabilities_recurring_availability_id_fkey'
  ) then
    alter table public.availabilities
      add constraint availabilities_recurring_availability_id_fkey
      foreign key (recurring_availability_id)
      references public.recurring_availabilities(id)
      on delete cascade;
  end if;
end$$;

create index if not exists idx_availabilities_recurring_fk on public.availabilities (recurring_availability_id);

-- Enable RLS and admin-only policies on parent table
alter table public.recurring_availabilities enable row level security;

-- Drop/replace policies idempotently
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='recurring_availabilities' and policyname='Admins select recurring_availabilities') then
    drop policy "Admins select recurring_availabilities" on public.recurring_availabilities;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='recurring_availabilities' and policyname='Admins insert recurring_availabilities') then
    drop policy "Admins insert recurring_availabilities" on public.recurring_availabilities;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='recurring_availabilities' and policyname='Admins update recurring_availabilities') then
    drop policy "Admins update recurring_availabilities" on public.recurring_availabilities;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='recurring_availabilities' and policyname='Admins delete recurring_availabilities') then
    drop policy "Admins delete recurring_availabilities" on public.recurring_availabilities;
  end if;
end$$;

create policy "Admins select recurring_availabilities"
  on public.recurring_availabilities
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins insert recurring_availabilities"
  on public.recurring_availabilities
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins update recurring_availabilities"
  on public.recurring_availabilities
  for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins delete recurring_availabilities"
  on public.recurring_availabilities
  for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


