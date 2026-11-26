-- profiles.role -------------------------------------------------------------
-- Grant admin by hand in the SQL editor:
--   update public.profiles set role = 'admin' where id = '<uuid>';
-- The update grant stays display_name-only, so users can't change their role.
alter table public.profiles
  add column role text not null default 'user'
  check (role in ('user', 'admin'));

-- Security definer so policies can call it regardless of profiles RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- comments: one level of replies --------------------------------------------
-- Deleting a top-level comment deletes its replies.
alter table public.comments
  add column parent_id bigint references public.comments (id) on delete cascade;

create index comments_parent_id_idx on public.comments (parent_id);

-- Same as before, plus: a reply's parent is a top-level comment on the same slug.
-- addComment checks the parent first, so a violation here means the rate limit.
drop policy "users add own comments, one per 10 s" on public.comments;

create policy "users add own comments and replies, one per 10 s"
  on public.comments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.comments c
      where c.user_id = (select auth.uid())
        and c.created_at > now() - interval '10 seconds'
    )
    and (
      parent_id is null
      or exists (
        select 1 from public.comments p
        where p.id = comments.parent_id
          and p.parent_id is null
          and p.target_slug = comments.target_slug
      )
    )
  );

drop policy "users remove own comments" on public.comments;

create policy "users remove own comments, admins remove any"
  on public.comments for delete
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

grant insert (parent_id) on public.comments to authenticated;

-- get_stats: favorite and comment counts per slug ---------------------------
-- Security definer: favorites RLS only shows your own rows. Returns counts only.
-- Comment counts include replies.
create function public.get_stats()
returns table (slug text, favorites bigint, comments bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select slug, sum(f)::bigint, sum(c)::bigint
  from (
    select heritage_slug as slug, 1 as f, 0 as c from public.favorites
    union all
    select target_slug, 0, 1 from public.comments
  ) t
  group by slug;
$$;

revoke execute on function public.get_stats() from public;
grant execute on function public.get_stats() to anon, authenticated;
