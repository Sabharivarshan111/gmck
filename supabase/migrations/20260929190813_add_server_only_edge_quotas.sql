-- Atomic model request quotas. The client roles receive no table or RPC access.
create table if not exists public.edge_usage_windows (
  subject_hash text not null,
  action text not null,
  bucket_start timestamptz not null,
  hits integer not null default 0,
  primary key (subject_hash, action, bucket_start)
);
alter table public.edge_usage_windows enable row level security;
revoke all on public.edge_usage_windows from public, anon, authenticated;
create or replace function public.consume_edge_quota(_subject_hash text, _action text, _bucket_start timestamptz, _limit integer)
returns boolean language plpgsql security invoker set search_path = public, pg_temp as $$
declare _hits integer;
begin
  if _subject_hash is null or length(_subject_hash) <> 64
    or _action not in ('ai_minute', 'ai_day', 'ip_day')
    or _limit < 1 or _limit > 10000 then
    raise exception 'invalid quota input';
  end if;
  insert into public.edge_usage_windows(subject_hash, action, bucket_start, hits)
  values (_subject_hash, _action, _bucket_start, 1)
  on conflict (subject_hash, action, bucket_start)
  do update set hits = public.edge_usage_windows.hits + 1
  returning hits into _hits;
  return _hits <= _limit;
end;
$$;
revoke execute on function public.consume_edge_quota(text,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.consume_edge_quota(text,text,timestamptz,integer) to service_role;
