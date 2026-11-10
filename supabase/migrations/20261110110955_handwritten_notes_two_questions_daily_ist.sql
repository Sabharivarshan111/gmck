-- Daily shared allowance: two questions, including essay and short-note triple taps.
alter table public.handwritten_note_trials add column usage_day date;
update public.handwritten_note_trials set usage_day=(created_at at time zone 'Asia/Kolkata')::date;
alter table public.handwritten_note_trials alter column usage_day set default ((now() at time zone 'Asia/Kolkata')::date);
alter table public.handwritten_note_trials alter column usage_day set not null;
alter table public.handwritten_note_trials add column question_count integer not null default 1 check (question_count between 1 and 400);
create index handwritten_note_trials_daily_user on public.handwritten_note_trials(user_id,usage_day);
create function public.reserve_daily_handwritten_note_trial(_user uuid, _generation text, _fingerprint text, _batch integer, _total integer, _cost integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.handwritten_note_trials%rowtype; token uuid; used_today integer; today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if _cost is null or _cost < 1 or _cost > 400 or _user is null or _batch < 0 or _total < 1 or _total > 400 or _batch >= _total then
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
    if r.fingerprint<>_fingerprint or r.total_batches<>_total or r.question_count<>_cost or r.usage_day<>today then
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
    select coalesce(sum(question_count),0) into used_today from public.handwritten_note_trials where user_id=_user and usage_day=today;
    if used_today + _cost > 2 then
      return jsonb_build_object('allowed',false,'code','PREMIUM_REQUIRED','remaining',greatest(0,2-used_today));
    end if;
    insert into public.handwritten_note_trials(user_id,generation_id,fingerprint,total_batches,usage_day,question_count)
      values(_user,_generation,_fingerprint,_total,today,_cost);
  end if;
  token := gen_random_uuid();
  update public.handwritten_note_trials set lease=token,lease_until=now()+interval '5 minutes' where user_id=_user and generation_id=_generation;
  return jsonb_build_object('allowed',true,'lease',token);
end;
$$;

revoke all on function public.reserve_daily_handwritten_note_trial(uuid,text,text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_daily_handwritten_note_trial(uuid,text,text,integer,integer,integer) to service_role;
-- Keep the original service-only API working during the Edge Function rollout.
create or replace function public.reserve_handwritten_note_trial(_user uuid,_generation text,_fingerprint text,_batch integer,_total integer)
returns jsonb language sql security invoker set search_path = '' as $$
  select public.reserve_daily_handwritten_note_trial(_user,_generation,_fingerprint,_batch,_total,1);
$$;
