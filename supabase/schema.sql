create table if not exists public.notes (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  content text not null check (char_length(btrim(content)) between 1 and 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

alter table public.notes add column if not exists category text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notes' and column_name = 'course'
  ) then
    execute $migration$
      update public.notes
      set category = coalesce(nullif(btrim(category), ''), nullif(btrim(course), ''), 'Umum')
      where category is null or btrim(category) = ''
    $migration$;
    alter table public.notes alter column course drop not null;
  end if;
end $$;

update public.notes set category = 'Umum' where category is null or btrim(category) = '';
alter table public.notes alter column category set not null;

create index if not exists notes_owner_updated_idx
  on public.notes (owner_id, updated_at desc);

revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

alter table public.notes enable row level security;

drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = owner_id);
