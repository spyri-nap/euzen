-- Run as database owner against TEST only. All fixtures roll back.
begin;
select set_config('euzen.test_a', gen_random_uuid()::text, true);
select set_config('euzen.test_b', gen_random_uuid()::text, true);
insert into auth.users(id) values
  (current_setting('euzen.test_a')::uuid),
  (current_setting('euzen.test_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('euzen.test_a'), true);
insert into public.euzen_profiles(user_id, display_name)
values (auth.uid(), 'Test A');
do $$
begin
  assert (select count(*) = 1 from public.euzen_profiles), 'Owner cannot read profile';
  begin
    insert into public.euzen_profiles(user_id, display_name)
    values (current_setting('euzen.test_b')::uuid, 'Forbidden');
    raise exception 'Cross-owner insert succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.euzen_profiles set user_id = current_setting('euzen.test_b')::uuid;
    raise exception 'Ownership transfer succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.euzen_profiles;
    raise exception 'Direct delete succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.euzen_profiles set language = 'invalid';
    raise exception 'Invalid language accepted';
  exception when check_violation then null;
  end;
end $$;
update public.euzen_profiles set display_name = 'Updated A', language = 'en';
select set_config('request.jwt.claim.sub', current_setting('euzen.test_b'), true);
do $$
declare changed integer;
begin
  assert (select count(*) = 0 from public.euzen_profiles), 'Other profile leaked';
  update public.euzen_profiles set display_name = 'Forbidden';
  get diagnostics changed = row_count;
  assert changed = 0, 'Other user profile updated';
end $$;
insert into public.euzen_profiles(user_id, display_name) values (auth.uid(), 'Test B');
select set_config('request.jwt.claim.sub', current_setting('euzen.test_a'), true);
do $$
begin
  assert (select count(*) = 1 from public.euzen_profiles), 'Isolation failed with two profiles';
  assert (select display_name = 'Updated A' and language = 'en' from public.euzen_profiles), 'Own update failed';
end $$;
set local role anon;
do $$
begin
  begin
    perform * from public.euzen_profiles;
    raise exception 'Anonymous read succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'PASS: profile ownership, update, constraints, anonymous access' as result;
rollback;
