create table public.user_match_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  target_titles text[] not null check (cardinality(target_titles) between 1 and 80),
  skills text[] not null check (cardinality(skills) between 1 and 80),
  focus_areas text[] not null check (cardinality(focus_areas) between 1 and 80),
  preferred_locations text[] not null default '{}',
  remote_preference text not null default 'any'
    check (remote_preference in ('remote', 'remote_preferred', 'hybrid', 'any')),
  min_base_salary integer check (min_base_salary is null or min_base_salary >= 0),
  excluded_keywords text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_match_profiles enable row level security;

revoke all on table public.user_match_profiles from anon;
grant select, insert, update, delete on table public.user_match_profiles to authenticated;

create policy "Users can read their own match profile"
on public.user_match_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own match profile"
on public.user_match_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own match profile"
on public.user_match_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own match profile"
on public.user_match_profiles for delete
to authenticated
using ((select auth.uid()) = user_id);
