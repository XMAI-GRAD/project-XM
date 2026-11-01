-- public.rls_auto_enable() backs Supabase's `ensure_rls` event trigger. It was
-- created outside our migrations. It is SECURITY DEFINER and lives in `public`,
-- so PostgREST exposes it as /rpc/rls_auto_enable to anon and authenticated
-- (security advisor finding). Nothing calls it directly, and event triggers
-- don't check EXECUTE when they fire, so revoking is safe.
-- `if exists`: the function may be missing on a project (e.g. prod).
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
