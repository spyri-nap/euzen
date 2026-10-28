create function euzen_sync.check_collection_limit() returns trigger language plpgsql set search_path='' as $$
declare maximum int;
begin
 perform 1 from euzen_sync.accounts where owner=new.owner for update;
 if new.payload is null then return new;end if;
 if exists(select 1 from euzen_sync.entities where owner=new.owner and kind=new.kind and id=new.id and payload is not null) then return new;end if;
 maximum:=case new.kind when 'exercise' then 10000 when 'workout' then 1000 when 'week' then 1000 when 'scheduled' then 20000 when 'session' then 10000 when 'checkin' then 20000 when 'settings' then 1 end;
 if maximum is null or (select count(*) from euzen_sync.entities where owner=new.owner and kind=new.kind and payload is not null)>=maximum then raise exception 'Collection limit exceeded' using errcode='54000';end if;
 return new;
end $$;
create trigger collection_limit before insert or update on euzen_sync.entities for each row execute function euzen_sync.check_collection_limit();
revoke all on function euzen_sync.check_collection_limit() from public,anon,authenticated;
