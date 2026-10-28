create or replace function euzen_sync.validate_workout(p jsonb) returns void language plpgsql set search_path='' as $$
declare workout_block jsonb;
begin
 if not euzen_sync.unique_ids(p->'blocks','id') or (select count(*)<>count(distinct e->>'id') from jsonb_array_elements(p->'blocks') b cross join lateral jsonb_array_elements(b->'exercises') e) then raise exception 'Duplicate workout IDs' using errcode='22023'; end if;
 if (select sum(case when b->>'mode'='amrap' then 1 else (b->>'rounds')::bigint*jsonb_array_length(b->'exercises') end) from jsonb_array_elements(p->'blocks') b)>10000 then raise exception 'Workout too large' using errcode='22023';end if;
 for workout_block in select value from jsonb_array_elements(p->'blocks') loop
  if workout_block->>'mode'='amrap' and jsonb_array_length(workout_block->'exercises')<>1 then raise exception 'AMRAP requires one exercise' using errcode='22023';end if;
 end loop;
end $$;
