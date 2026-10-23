-- Candidate migration. Apply only to an explicitly approved test project.
begin;
create table public.euzen_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (length(display_name) between 1 and 100),
 language text not null default 'de' check (language in ('de','en')),
 goals text[] not null default '{}', equipment text[] not null default '{}',
 preferred_minutes integer check (preferred_minutes between 1 and 300),
 experience text check (experience in ('beginner','intermediate','advanced'))
);
create table public.euzen_spaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 generation bigint not null default 1 check (generation > 0)
);
-- One row per domain entity, never a device-wide AppState blob.
-- Payload validation and normalized nested references are a separate release gate.
create table public.euzen_entities (
 user_id uuid not null references public.euzen_spaces(user_id) on delete cascade,
 generation bigint not null,
 kind text not null check (kind in ('exercise','workout','week','scheduled','session','checkin','settings')),
 entity_id text not null check (length(entity_id) between 1 and 100),
 revision bigint not null check (revision > 0),
 payload jsonb,
 deleted boolean not null default false,
 primary key (user_id,generation,kind,entity_id),
 check ((deleted and payload is null) or (not deleted and payload is not null and jsonb_typeof(payload)='object'))
);
create table public.euzen_receipts (
 user_id uuid not null references auth.users(id) on delete cascade,
 operation_id uuid not null,
 request jsonb not null,
 response jsonb not null,
 primary key(user_id,operation_id)
);
alter table public.euzen_profiles enable row level security;
alter table public.euzen_spaces enable row level security;
alter table public.euzen_entities enable row level security;
alter table public.euzen_receipts enable row level security;
revoke all on public.euzen_profiles,public.euzen_spaces,public.euzen_entities,public.euzen_receipts from anon,authenticated;
grant select,insert,update on public.euzen_profiles to authenticated;
grant select on public.euzen_spaces,public.euzen_entities,public.euzen_receipts to authenticated;
create policy profile_owner on public.euzen_profiles to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy space_owner on public.euzen_spaces for select to authenticated using ((select auth.uid())=user_id);
create policy entity_owner on public.euzen_entities for select to authenticated
 using ((select auth.uid())=user_id and generation=(select generation from public.euzen_spaces where user_id=(select auth.uid())));
create policy receipt_owner on public.euzen_receipts for select to authenticated using ((select auth.uid())=user_id);

create function public.euzen_initialize() returns bigint language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); g bigint;
begin
 if u is null then raise exception 'Authentication required'; end if;
 insert into public.euzen_spaces(user_id) values(u) on conflict do nothing;
 select generation into g from public.euzen_spaces where user_id=u;
 return g;
end $$;

create function public.euzen_mutate(op uuid, gen bigint, entity_kind text, id text, expected bigint, body jsonb, remove boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current_gen bigint; old_rev bigint; req jsonb; saved public.euzen_receipts; result jsonb;
begin
 if u is null then raise exception 'Authentication required'; end if;
 select generation into current_gen from public.euzen_spaces where user_id=u for update;
 if current_gen is null then raise exception 'Space not initialized'; end if;
 if gen is null or current_gen<>gen then return jsonb_build_object('status','generation_changed','generation',current_gen); end if;
 req:=jsonb_build_object('gen',gen,'kind',entity_kind,'id',id,'expected',expected,'body',body,'remove',remove);
 select * into saved from public.euzen_receipts where user_id=u and operation_id=op;
 if found then
  if saved.request<>req then raise exception 'Operation ID reused with different content'; end if;
  return saved.response;
 end if;
 select revision into old_rev from public.euzen_entities where user_id=u and generation=gen and kind=entity_kind and entity_id=id;
 if coalesce(old_rev,0)<>expected then
  return jsonb_build_object('status','conflict','revision',coalesce(old_rev,0));
 end if;
 insert into public.euzen_entities(user_id,generation,kind,entity_id,revision,payload,deleted)
 values(u,gen,entity_kind,id,expected+1,case when remove then null else body end,remove)
 on conflict(user_id,generation,kind,entity_id) do update set revision=excluded.revision,payload=excluded.payload,deleted=excluded.deleted;
 result:=jsonb_build_object('status','applied','revision',expected+1,'generation',gen);
 insert into public.euzen_receipts values(u,op,req,result);
 return result;
end $$;

create function public.euzen_reset(op uuid, expected_generation bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); g bigint; saved public.euzen_receipts; req jsonb; result jsonb;
begin
 if u is null then raise exception 'Authentication required'; end if;
 select generation into g from public.euzen_spaces where user_id=u for update;
 if g is null then raise exception 'Space not initialized'; end if;
 req:=jsonb_build_object('reset',expected_generation);
 select * into saved from public.euzen_receipts where user_id=u and operation_id=op;
 if found then
  if saved.request<>req then raise exception 'Operation ID reused'; end if;
  return saved.response;
 end if;
 if expected_generation is null or g<>expected_generation then return jsonb_build_object('status','generation_changed','generation',g); end if;
 delete from public.euzen_entities where user_id=u;
 update public.euzen_spaces set generation=g+1 where user_id=u;
 result:=jsonb_build_object('status','reset','generation',g+1);
 insert into public.euzen_receipts values(u,op,req,result);
 return result;
end $$;
revoke all on function public.euzen_initialize(),public.euzen_mutate(uuid,bigint,text,text,bigint,jsonb,boolean),public.euzen_reset(uuid,bigint) from public,anon;
grant execute on function public.euzen_initialize(),public.euzen_mutate(uuid,bigint,text,text,bigint,jsonb,boolean),public.euzen_reset(uuid,bigint) to authenticated;
commit;
