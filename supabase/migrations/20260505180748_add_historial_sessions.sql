-- Migration: add_historial_sessions
-- Adds a session-level history table that tracks, for every completed exercise
-- session, the date, the phase and the lesion it was associated with.
-- Non-destructive: no existing tables are modified.

create table if not exists public.historial_sessions (
    id_sessio          bigserial primary key,
    dni_pacient        text        not null,
    id_diagnostic      bigint      not null,
    id_lesio           integer     not null,
    fase               smallint    not null check (fase between 1 and 3),
    punts_obtinguts    integer     not null default 0,
    data_realitzacio   timestamptz not null default now()
);

create index if not exists idx_historial_sessions_dni
    on public.historial_sessions (dni_pacient);

create index if not exists idx_historial_sessions_diag
    on public.historial_sessions (id_diagnostic);

-- Match the access pattern of the existing tables (client-side reads/writes).
alter table public.historial_sessions enable row level security;

drop policy if exists "historial_sessions_select_all" on public.historial_sessions;
drop policy if exists "historial_sessions_insert_all" on public.historial_sessions;

create policy "historial_sessions_select_all"
    on public.historial_sessions
    for select
    to anon, authenticated
    using (true);

create policy "historial_sessions_insert_all"
    on public.historial_sessions
    for insert
    to anon, authenticated
    with check (true);
