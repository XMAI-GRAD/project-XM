-- comments ------------------------------------------------------------------
-- user_id references profiles (not auth.users) so PostgREST can embed the author.
create table public.comments (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_slug text not null check (char_length(target_slug) between 1 and 200),
  body text not null check (char_length(body) between 1 and 1000 and body ~ '\S'),
  created_at timestamptz not null default now()
);

create index comments_target_slug_created_at_idx
  on public.comments (target_slug, created_at desc);
-- Rate-limit check and the profiles "has commented" lookup.
create index comments_user_id_created_at_idx
  on public.comments (user_id, created_at desc);

alter table public.comments enable row level security;

create policy "comments are viewable by everyone"
  on public.comments for select
  to anon, authenticated
  using (true);

-- ponytail: two inserts in the same instant can both pass; fine for a spam guard.
create policy "users add own comments, one per 10 s"
  on public.comments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.comments c
      where c.user_id = (select auth.uid())
        and c.created_at > now() - interval '10 seconds'
    )
  );

create policy "users remove own comments"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Cloud auto-grants everything to API roles; grant back only what policies allow.
-- No insert on created_at: a backdated row would dodge the rate limit.
revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (target_slug, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- profiles: readable only by their owner, or by anyone once they've commented.
drop policy "profiles are viewable by everyone" on public.profiles;

create policy "profiles are viewable by owner or once they comment"
  on public.profiles for select
  to anon, authenticated
  using (
    (select auth.uid()) = id
    or exists (select 1 from public.comments c where c.user_id = profiles.id)
  );
