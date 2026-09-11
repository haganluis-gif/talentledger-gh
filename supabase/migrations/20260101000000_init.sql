-- TalentLedger GH - Init schema

create table if not exists public.contestants (
  id uuid default gen_random_uuid() primary key,
  contestant_id text unique not null,
  full_name text not null,
  location text not null,
  phone text not null,
  clip_url text,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz default now()
);

alter table public.contestants enable row level security;

create policy "Public read contestants"
on public.contestants
for select
using (true);

create policy "Public insert contestants"
on public.contestants
for insert
with check (true);

insert into storage.buckets (id, name, public)
values ('audition-clips', 'audition-clips', true)
on conflict (id) do nothing;

create policy "Public read audition clips"
on storage.objects
for select
using (bucket_id = 'audition-clips');

create policy "Public insert audition clips"
on storage.objects
for insert
with check (bucket_id = 'audition-clips');