-- Migration: add_objectius_pacient
-- Taula per emmagatzemar els objectius/missions del pacient.
-- Cada pacient té 4 objectius que un cop assolits no es desmarquen mai.

create table if not exists public.objectius_pacient (
    dni_pacient          text    primary key,
    primera_sessio       boolean not null default false,
    primer_diagnostic    boolean not null default false,
    primera_cura         boolean not null default false,
    fisio_assignat       boolean not null default false
);

-- RLS
alter table public.objectius_pacient enable row level security;

drop policy if exists "objectius_select_all" on public.objectius_pacient;
drop policy if exists "objectius_insert_all" on public.objectius_pacient;
drop policy if exists "objectius_update_all" on public.objectius_pacient;

create policy "objectius_select_all"
    on public.objectius_pacient
    for select
    to anon, authenticated
    using (true);

create policy "objectius_insert_all"
    on public.objectius_pacient
    for insert
    to anon, authenticated
    with check (true);

create policy "objectius_update_all"
    on public.objectius_pacient
    for update
    to anon, authenticated
    using (true)
    with check (true);
