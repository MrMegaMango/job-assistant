begin;

alter table public.user_match_profiles
  add column id uuid not null default gen_random_uuid(),
  add column name text not null default 'Primary',
  add column created_at timestamptz not null default now();

alter table public.user_match_profiles
  drop constraint user_match_profiles_pkey,
  add constraint user_match_profiles_pkey primary key (id),
  add constraint user_match_profiles_name_length
    check (char_length(name) between 1 and 60),
  add constraint user_match_profiles_name_trimmed
    check (name = btrim(name));

create unique index user_match_profiles_user_name_idx
  on public.user_match_profiles (user_id, lower(name));

create index user_match_profiles_user_created_idx
  on public.user_match_profiles (user_id, created_at, id);

commit;
