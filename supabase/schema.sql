-- Mirr Database Schema
-- Voer dit uit in Supabase > SQL Editor

-- Profiles (automatisch aangemaakt bij signup)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company text,
  plan text default 'free' not null,
  credits integer default 1 not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Gebruiker ziet eigen profiel" on public.profiles
  for select using (auth.uid() = id);

create policy "Gebruiker update eigen profiel" on public.profiles
  for update using (auth.uid() = id);

-- Automatisch profiel aanmaken bij signup (met 1 gratis credit)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company, plan, credits)
  values (new.id, new.raw_user_meta_data->>'company', 'free', 1);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Audits
create table public.audits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text not null,
  category text not null,
  positioning text not null,
  competitors text[] default '{}',
  status text default 'queued' not null, -- queued, processing, completed, failed
  report jsonb,
  report_markdown text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.audits enable row level security;

create policy "Gebruiker ziet eigen audits" on public.audits
  for select using (auth.uid() = user_id);

create policy "Gebruiker maakt eigen audits" on public.audits
  for insert with check (auth.uid() = user_id);

-- Index voor snelle lookups
create index audits_user_id_idx on public.audits(user_id);
create index audits_status_idx on public.audits(status);
