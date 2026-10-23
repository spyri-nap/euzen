-- Requires migration and pgTAP in an isolated Supabase test database.
-- NOT executed against a remote project by the coding agent.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(7);
insert into auth.users(id) values('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is(public.euzen_initialize(),1::bigint,'A has empty initial generation');
select is(public.euzen_mutate('20000000-0000-4000-8000-000000000001',1,'exercise','one',0,'{"name":"A exercise"}') ->> 'status','applied','A can create own entity');
select is(public.euzen_mutate('20000000-0000-4000-8000-000000000001',1,'exercise','one',0,'{"name":"A exercise"}') ->> 'status','applied','Exact retry is idempotent');
select is((select count(*)::integer from public.euzen_entities),1,'No duplicate after retry');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.euzen_entities),0,'B cannot read A');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is(public.euzen_reset('20000000-0000-4000-8000-000000000002',1)->>'generation','2','Reset advances generation');
select is(public.euzen_mutate('20000000-0000-4000-8000-000000000003',1,'exercise','one',1,'{"name":"Stale"}')->>'status','generation_changed','Old client cannot restore deleted data');
reset role;
select * from finish();
rollback;
