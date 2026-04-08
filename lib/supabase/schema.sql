-- HealthAI Full Schema
-- Run this in your Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → paste & Run

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Profiles table  (one row per auth user)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,

  -- Step 1: Account
  full_name text not null default '',
  email     text not null default '',
  avatar_url text,

  -- Step 2: Basic Health Profile
  age    integer check (age >= 1 and age <= 150),
  gender text check (gender in ('Male','Female','Other','Prefer not to say')),

  -- Step 3: Body Metrics
  height_cm    numeric(5,1),
  weight_kg    numeric(5,1),
  bmi          numeric(4,1),
  bmi_category text check (bmi_category in ('Underweight','Normal','Overweight','Obese')),

  -- Step 4: Lifestyle Habits
  smoking           text,
  alcohol           text,
  physical_activity text,
  sleep_duration    text,
  diet_type         text,
  stress_level      text,

  -- Step 5: Medical Background
  existing_diseases text[] default '{}',
  allergies         text,

  -- Tracking
  profile_completed boolean default false,
  onboarding_step   integer default 1,

  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Health Analyses table  (one row per symptom check)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_analyses (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references auth.users on delete cascade not null,

  -- Symptoms submitted
  symptoms_input      text[]  not null,   -- raw input (known + free-typed)
  matched_symptoms    text[]  default '{}',
  mapped_symptoms     jsonb   default '[]',   -- [{input, mapped_to}]
  unknown_symptoms    jsonb   default '[]',

  -- ML prediction
  predicted_disease   text    not null,
  confidence          numeric(5,2),
  top_predictions     jsonb   default '[]',  -- [{disease, confidence}]

  -- AI response
  description         text,
  precautions         text[],
  suggestions         text,

  -- Patient profile snapshot at time of analysis
  profile_snapshot    jsonb   default '{}',

  -- Timestamps
  created_at  timestamptz default now() not null
);

-- RLS
alter table public.health_analyses enable row level security;

create policy "Users can view own analyses"
  on public.health_analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.health_analyses for insert with check (auth.uid() = user_id);

-- Index for fast history lookup
create index if not exists health_analyses_user_created
  on public.health_analyses (user_id, created_at desc);
