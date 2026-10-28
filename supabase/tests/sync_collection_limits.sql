begin;
insert into auth.users(id) values('82000000-0000-4000-8000-000000000001');
insert into euzen_sync.accounts(owner) values('82000000-0000-4000-8000-000000000001');
insert into euzen_sync.entities(owner,kind,id,revision,payload)
select '82000000-0000-4000-8000-000000000001','week','limit-'||i,1,jsonb_build_object('id','limit-'||i,'name','Quota fixture','startDate','2026-10-28') from generate_series(1,1000) i;
select set_config('request.jwt.claim.sub','82000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $test$
declare op jsonb:='{"id":"83000000-0000-4000-8000-000000000001","owner":"82000000-0000-4000-8000-000000000001","generation":1,"kind":"week","entityId":"limit-new","expectedRevision":0,"payload":{"id":"limit-new","name":"Overflow","startDate":"2026-10-28"},"remove":false}';r jsonb;
begin
begin perform public.euzen_sync_push(op);raise exception 'Collection overflow accepted';exception when sqlstate '54000' then null;end;
r:=public.euzen_sync_push(op||jsonb_build_object('id','83000000-0000-4000-8000-000000000002','entityId','limit-1','expectedRevision',1,'payload',jsonb_build_object('id','limit-1','name','Edit at quota','startDate','2026-10-28')));
if r->>'kind'<>'accepted' then raise exception 'Existing entity update rejected at quota';end if;
end $test$;
reset role;
select 'passed: collection overflow blocked, updates at quota allowed' as result;
rollback;
