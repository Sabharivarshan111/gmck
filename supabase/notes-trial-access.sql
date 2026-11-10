-- Two successful note generations per account. Only the verified Edge Function
-- service role can reserve/finish trials; clients cannot grant themselves access.
create table public.handwritten_note_trials (
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id text not null check (length(generation_id) between 1 and 160),
  fingerprint text not null,
  total_batches integer not null check (total_batches between 1 and 400),
  results jsonb not null default '{}'::jsonb,
  next_batch integer not null default 0,
  lease uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id,generation_id)
);
alter table public.handwritten_note_trials enable row level security;
revoke all on public.handwritten_note_trials from public,anon,authenticated;
grant all on public.handwritten_note_trials to service_role;

create function public.reserve_handwritten_note_trial(_user uuid, _generation text, _fingerprint text, _batch integer, _total integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.handwritten_note_trials%rowtype; token uuid;
begin
  if _user is null or _batch < 0 or _total < 1 or _total > 400 or _batch >= _total then
    raise exception 'Invalid note generation';
  end if;
  -- Serialize across devices and parallel requests for this account.
  perform pg_advisory_xact_lock(hashtextextended(_user::text,736119));
  if exists(select 1 from public.user_roles where user_id=_user and role='admin')
    or exists(select 1 from public.premium_subscriptions where user_id=_user and plan='adfree_monthly' and expires_at>now()) then
    return jsonb_build_object('allowed',true,'premium',true);
  end if;
  delete from public.handwritten_note_trials where user_id=_user and next_batch=0 and lease_until<now();
  select * into r from public.handwritten_note_trials where user_id=_user and generation_id=_generation for update;
  if found then
    if r.fingerprint<>_fingerprint or r.total_batches<>_total then
      return jsonb_build_object('allowed',false,'code','GENERATION_MISMATCH');
    end if;
    if r.results ? _batch::text then
      return jsonb_build_object('allowed',true,'cached_response',r.results -> _batch::text);
    end if;
    if r.next_batch<>_batch or (r.lease is not null and r.lease_until>now()) then
      return jsonb_build_object('allowed',false,'code','GENERATION_BUSY');
    end if;
  else
    if _batch<>0 then return jsonb_build_object('allowed',false,'code','GENERATION_MISMATCH'); end if;
    if (select count(*) from public.handwritten_note_trials where user_id=_user)>=2 then
      return jsonb_build_object('allowed',false,'code','PREMIUM_REQUIRED');
    end if;
    insert into public.handwritten_note_trials(user_id,generation_id,fingerprint,total_batches)
      values(_user,_generation,_fingerprint,_total);
  end if;
  token := gen_random_uuid();
  update public.handwritten_note_trials set lease=token,lease_until=now()+interval '5 minutes' where user_id=_user and generation_id=_generation;
  return jsonb_build_object('allowed',true,'lease',token);
end;
$$;
create function public.finish_handwritten_note_trial(_user uuid,_generation text,_lease uuid,_batch integer,_result jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(_user::text,736119));
  if _result is null then
    delete from public.handwritten_note_trials where user_id=_user and generation_id=_generation and lease=_lease and next_batch=0;
    update public.handwritten_note_trials set lease=null,lease_until=null where user_id=_user and generation_id=_generation and lease=_lease;
    return true;
  end if;
  update public.handwritten_note_trials set results=results || jsonb_build_object(_batch::text,_result),next_batch=_batch+1,lease=null,lease_until=null
    where user_id=_user and generation_id=_generation and lease=_lease and next_batch=_batch;
  return found;
end;
$$;
revoke all on function public.reserve_handwritten_note_trial(uuid,text,text,integer,integer) from public,anon,authenticated;
revoke all on function public.finish_handwritten_note_trial(uuid,text,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_handwritten_note_trial(uuid,text,text,integer,integer) to service_role;
grant execute on function public.finish_handwritten_note_trial(uuid,text,uuid,integer,jsonb) to service_role;
