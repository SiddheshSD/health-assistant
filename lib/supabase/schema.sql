-- HealthAI User Profiles Table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- Create the profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  
  -- Step 1: Account info
  full_name text not null,
  email text not null,
  avatar_url text,
  
  -- Step 2: Basic Health Profile
  age integer check (age >= 1 and age <= 150),
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  
  -- Step 3: Body Metrics
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  bmi numeric(4,1),
  bmi_category text check (bmi_category in ('underweight', 'normal', 'overweight', 'obese')),
  
  -- Step 4: Lifestyle Habits
  smoking_habit text check (smoking_habit in ('non_smoker', 'occasional', 'regular')),
  alcohol_consumption text check (alcohol_consumption in ('no', 'occasionally', 'frequently')),
  physical_activity text check (physical_activity in ('sedentary', 'moderate', 'active')),
  sleep_duration text check (sleep_duration in ('less_than_5', '5_to_7', '7_to_9', 'more_than_9')),
  diet_type text check (diet_type in ('vegetarian', 'non_vegetarian', 'vegan')),
  stress_level text check (stress_level in ('low', 'medium', 'high')),
  
  -- Step 5: Medical Background
  existing_diseases text[] default '{}',
  allergies text,
  
  -- Profile completion tracking
  profile_completed boolean default false,
  onboarding_step integer default 1,
  
  -- Timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS Policies: Users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-update `updated_at` on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
