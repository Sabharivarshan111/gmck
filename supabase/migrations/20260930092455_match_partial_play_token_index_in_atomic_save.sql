-- Verified Play entitlements are saved atomically by service-role callers only.
create or replace function public.save_verified_play_purchase(
  _user_id uuid, _token text, _account_bound boolean, _rows jsonb
) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  item jsonb;
  current_row public.premium_subscriptions%rowtype;
  saved_row public.premium_subscriptions%rowtype;
  existing_count integer;
  result jsonb := '[]'::jsonb;
  row_token text;
  expected_bonus text;
begin
  if _user_id is null or length(_token) < 10 or length(_token) > 4000
     or _token is null or _rows is null or _account_bound is null or jsonb_typeof(_rows) <> 'array'
     or jsonb_array_length(_rows) <> 2 then
    raise exception 'Invalid verified purchase' using errcode = '22023';
  end if;
  expected_bonus := case when _rows->0->>'plan' = 'adfree_monthly' then ':notes' else ':adfree' end;
  if _rows->0->>'play_purchase_token' is distinct from _token
     or _rows->1->>'play_purchase_token' is distinct from _token || expected_bonus then
    raise exception 'Invalid purchase rows' using errcode = '22023';
  end if;
  -- Same-token requests serialize before checking owners and writing either row.
  perform pg_advisory_xact_lock(hashtextextended('orbit-play:' || _token, 0));
  select count(*) into existing_count from public.premium_subscriptions
    where play_purchase_token in (_token, _token || ':notes', _token || ':adfree');
  if exists (select 1 from public.premium_subscriptions
    where play_purchase_token in (_token, _token || ':notes', _token || ':adfree')
      and user_id <> _user_id) then
    raise exception 'Purchase belongs to another account' using errcode = '42501';
  end if;
  -- An unbound legacy purchase may restore its recorded owner, but cannot be
  -- claimed by a new account merely by presenting a copied bearer token.
  if not _account_bound and existing_count = 0 then
    raise exception 'Unbound purchase requires account recovery' using errcode = '42501';
  end if;
  for item in select value from jsonb_array_elements(_rows) loop
    row_token := item->>'play_purchase_token';
    if (item->>'user_id')::uuid is distinct from _user_id
       or item->>'source' is distinct from 'play'
       or item->>'plan' not in ('adfree_monthly', 'notes_fmspm', 'notes_pharmac') then
      raise exception 'Invalid entitlement' using errcode = '22023';
    end if;
    select * into current_row from public.premium_subscriptions
      where play_purchase_token = row_token for update;
    if found and current_row.user_id <> _user_id then
      raise exception 'Purchase belongs to another account' using errcode = '42501';
    end if;
    -- Only the primary subscription expiry renews. Existing notes/bonus
    -- expiries remain unchanged, including expiries already revoked by RTDN.
    insert into public.premium_subscriptions (
      user_id,email,plan,amount_paise,source,play_purchase_token,
      play_product_id,play_order_id,play_state,auto_renewing,expires_at,updated_at
    ) values (
      _user_id,item->>'email',item->>'plan',0,'play',row_token,
      item->>'play_product_id',item->>'play_order_id',item->>'play_state',
      (item->>'auto_renewing')::boolean,(item->>'expires_at')::timestamptz,now()
    ) on conflict (play_purchase_token) where play_purchase_token is not null do update set
      email = excluded.email,
      play_state = excluded.play_state,
      auto_renewing = excluded.auto_renewing,
      play_order_id = excluded.play_order_id,
      expires_at = case when row_token = _token and excluded.plan = 'adfree_monthly'
        then excluded.expires_at else premium_subscriptions.expires_at end,
      updated_at = now()
    where premium_subscriptions.user_id = _user_id
    returning * into saved_row;
    if not found then
      raise exception 'Purchase owner changed' using errcode = '42501';
    end if;
    result := result || jsonb_build_array(jsonb_build_object(
      'plan',saved_row.plan,'expires_at',saved_row.expires_at));
  end loop;
  return result;
end;
$$;
revoke all on function public.save_verified_play_purchase(uuid,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.save_verified_play_purchase(uuid,text,boolean,jsonb) to service_role;
