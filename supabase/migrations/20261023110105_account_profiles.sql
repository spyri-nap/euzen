-- Approved Eúzēn test environment. No demo users, seeds or auth triggers.
create table public.euzen_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (
    display_name = btrim(display_name) and char_length(display_name) between 1 and 100
  ),
  language text not null default 'de' check (language in ('de', 'en')),
  goals text[] not null default '{}' check (
    cardinality(goals) <= 12 and octet_length(goals::text) <= 4096
    and array_position(goals, null) is null
  ),
  equipment text[] not null default '{}' check (
    cardinality(equipment) <= 30 and octet_length(equipment::text) <= 4096
    and array_position(equipment, null) is null
  ),
  preferred_minutes integer check (preferred_minutes between 1 and 300),
  experience text check (experience in ('beginner', 'intermediate', 'advanced'))
);

alter table public.euzen_profiles enable row level security;
revoke all on public.euzen_profiles from public, anon, authenticated;
grant select, insert on public.euzen_profiles to authenticated;
grant update (display_name, language, goals, equipment, preferred_minutes, experience)
  on public.euzen_profiles to authenticated;

create policy profile_read_own on public.euzen_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy profile_create_own on public.euzen_profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profile_update_own on public.euzen_profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
