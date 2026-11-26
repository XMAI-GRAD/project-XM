-- User-generated data only. Content lives in code; rows reference it by slug.

-- profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Cloud auto-grants everything to API roles; grant back only what policies allow.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Copy name/avatar from OAuth (Google) metadata when present.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- favorites -----------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  heritage_slug text not null check (char_length(heritage_slug) between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, heritage_slug)
);

alter table public.favorites enable row level security;

create policy "users read own favorites"
  on public.favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users add own favorites"
  on public.favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users remove own favorites"
  on public.favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Cloud auto-grants everything to API roles; grant back only what policies allow.
revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

-- contact_submissions -------------------------------------------------------
-- Insert-only from the app; read submissions in the Supabase dashboard.
create table public.contact_submissions (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "anyone can submit the contact form"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

-- Cloud auto-grants everything to API roles; grant back only what policies allow.
revoke all on public.contact_submissions from anon, authenticated;
grant insert (name, email, message) on public.contact_submissions to anon, authenticated;
