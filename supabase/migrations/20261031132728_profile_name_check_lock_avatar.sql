-- profiles: cap display_name, and keep avatar_url Google-only. -------------

-- Google names longer than the cap are truncated by the trigger below.
alter table public.profiles
  add constraint profiles_display_name_length
  check (char_length(display_name) <= 100);

-- The avatar comes from Google; users edit display_name only.
revoke update (avatar_url) on public.profiles from authenticated;

-- Same as init, plus left(…, 100) so a long Google name can't break signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 100),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
