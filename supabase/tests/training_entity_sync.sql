begin;
insert into auth.users(id) values('30000000-0000-4000-8000-000000000001'),('30000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $test$
declare op jsonb:='{"id":"40000000-0000-4000-8000-000000000001","owner":"30000000-0000-4000-8000-000000000001","generation":1,"kind":"week","entityId":"test","expectedRevision":0,"payload":{"id":"test","name":"Test","startDate":"2026-10-28"},"remove":false}'; r jsonb;
begin
r:=public.euzen_sync_push(op);
if r<>public.euzen_sync_push(op) or r->>'revision'<>'1' then raise exception 'Idempotency failed';end if;
r:=public.euzen_sync_push(op||'{"id":"40000000-0000-4000-8000-000000000002"}');
if r->>'kind'<>'conflict' then raise exception 'Conflict missing';end if;
begin perform public.euzen_sync_push(op||'{"generation":2}');raise exception 'generation accepted';exception when raise_exception then if sqlerrm='generation accepted' then raise;end if;end;
begin perform public.euzen_sync_push(op||'{"id":"40000000-0000-4000-8000-000000000003","payload":{}}');raise exception 'invalid accepted';exception when raise_exception then if sqlerrm='invalid accepted' then raise;end if;end;
begin perform public.euzen_sync_push(op||'{"owner":"30000000-0000-4000-8000-000000000002"}');raise exception 'owner accepted';exception when insufficient_privilege then null;end;
begin perform 1 from euzen_sync.entities;raise exception 'direct access accepted';exception when insufficient_privilege then null;end;
perform set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
if public.euzen_sync_pull()->'entities'<>'[]'::jsonb then raise exception 'Isolation failed';end if;
end $test$;
reset role;
set local role anon;
do $test$ begin
begin perform public.euzen_sync_pull();raise exception 'anon accepted';exception when insufficient_privilege then null;end;
end $test$;
reset role;
select 'passed: idempotency, conflict, generation, validation, owner isolation, private tables, anon denial' as result;
rollback;
