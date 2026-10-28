-- Additional business checks; all trigger functions are private and invoker-only.
create function euzen_sync.unique_ids(items jsonb, key text) returns boolean language sql immutable set search_path='' as $$
 select count(*)=count(distinct e->>key) from jsonb_array_elements(items) e
$$;
create function euzen_sync.validate_workout(p jsonb) returns void language plpgsql set search_path='' as $$
declare b jsonb;
begin
 if not euzen_sync.unique_ids(p->'blocks','id') or (select count(*)<>count(distinct e->>'id') from jsonb_array_elements(p->'blocks') b cross join lateral jsonb_array_elements(b->'exercises') e) then raise exception 'Duplicate workout IDs' using errcode='22023'; end if;
 if (select sum(case when b->>'mode'='amrap' then 1 else (b->>'rounds')::bigint*jsonb_array_length(b->'exercises') end) from jsonb_array_elements(p->'blocks') b)>10000 then raise exception 'Workout too large' using errcode='22023';end if;
 for b in select value from jsonb_array_elements(p->'blocks') loop
  if b->>'mode'='amrap' and jsonb_array_length(b->'exercises')<>1 then raise exception 'AMRAP requires one exercise' using errcode='22023';end if;
 end loop;
end $$;
create function euzen_sync.check_entity() returns trigger language plpgsql set search_path='' as $$
declare p jsonb:=new.payload; phase jsonb; result jsonb; matched jsonb;
begin
 -- Also serialize administrative writes against normal RPC writes.
 perform 1 from euzen_sync.accounts where owner=new.owner for update;
 if (select coalesce(sum(octet_length(payload::text)),0) from euzen_sync.entities where owner=new.owner and (kind,id)<>(new.kind,new.id))+coalesce(octet_length(p::text),0)>67108864 then raise exception 'Account data quota exceeded' using errcode='54000';end if;
 if p is null then return new;end if;
 if new.kind='workout' then perform euzen_sync.validate_workout(p);end if;
 if new.kind in ('week','scheduled','checkin') then
  declare d text:=case when new.kind='week' then p->>'startDate' else p->>'date' end;
  begin if to_char(d::date,'YYYY-MM-DD')<>d then raise exception 'Invalid date' using errcode='22023';end if;end;
 end if;
 if new.kind='session' then
  perform euzen_sync.validate_workout(p->'snapshot');
  if not euzen_sync.unique_ids(p->'exercises','id') or not euzen_sync.unique_ids(p->'phases','id') or not euzen_sync.unique_ids(p->'results','stepId') then raise exception 'Duplicate session IDs' using errcode='22023';end if;
  if (p->>'phaseIndex')::int>=jsonb_array_length(p->'phases') or ((p->>'status'='active') is distinct from (p->'finishedAt'='null'::jsonb)) or (p->>'finishedAt')::numeric<(p->>'startedAt')::numeric or ((p#>>'{timer,status}'='running') is distinct from (p#>'{timer,startedAt}'<>'null'::jsonb)) then raise exception 'Invalid session state' using errcode='22023';end if;
  if p->>'status'='active' and exists(select 1 from euzen_sync.entities where owner=new.owner and kind='session' and id<>new.id and payload->>'status'='active') then raise exception 'Another session is active' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(p#>'{snapshot,blocks}') b cross join lateral jsonb_array_elements(b->'exercises') e where not exists(select 1 from jsonb_array_elements(p->'exercises') x where x->>'id'=e->>'exerciseId')) then raise exception 'Missing snapshot exercise' using errcode='22023';end if;
  for phase in select value from jsonb_array_elements(p->'phases') loop
   if not exists(select 1 from jsonb_array_elements(p#>'{snapshot,blocks}') b cross join lateral jsonb_array_elements(b->'exercises') e where b->>'id'=phase->>'blockId' and e->>'id'=phase->>'prescriptionId' and e->>'exerciseId'=phase->>'exerciseId') then raise exception 'Invalid phase reference' using errcode='22023';end if;
  end loop;
  for result in select value from jsonb_array_elements(p->'results') loop
   select value into matched from jsonb_array_elements(p->'phases') where value->>'id'=result->>'stepId';
   if matched is null or matched->>'kind'<>'work' or exists(select 1 from unnest(array['blockId','prescriptionId','exerciseId','round']) k where matched->k is distinct from result->k) or (coalesce((result->>'pendingConfirmation')::boolean,false) and not (result->>'skipped')::boolean) then raise exception 'Invalid result reference' using errcode='22023';end if;
  end loop;
  if p->>'status'='complete' and (exists(select 1 from jsonb_array_elements(p->'results') r where (r->>'skipped')::boolean) or jsonb_array_length(p->'results')<>(select count(*) from jsonb_array_elements(p->'phases') ph where ph->>'kind'='work')) then raise exception 'Incomplete results' using errcode='22023';end if;
 end if;
 return new;
end $$;
create trigger entity_integrity before insert or update on euzen_sync.entities for each row execute function euzen_sync.check_entity();
create function euzen_sync.check_receipt() returns trigger language plpgsql set search_path='' as $$
begin
 perform 1 from euzen_sync.accounts where owner=new.owner for update;
 if (select count(*) from euzen_sync.receipts where owner=new.owner)>=100000 or (select coalesce(sum(octet_length(request::text)+octet_length(response::text)),0) from euzen_sync.receipts where owner=new.owner)+octet_length(new.request::text)+octet_length(new.response::text)>134217728 then raise exception 'Operation receipt quota exceeded; export and contact support' using errcode='54000';end if;
 return new;
end $$;
create trigger receipt_quota before insert on euzen_sync.receipts for each row execute function euzen_sync.check_receipt();
revoke all on all functions in schema euzen_sync from public,anon,authenticated;
