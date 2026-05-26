-- Migration: add_penalitzacio_to_historial_sessions
-- Afegeix la columna booleana `penalitzacio` a historial_sessions
-- per marcar les sessions que han estat penalitzades per inactivitat (>72h).
-- També afegeix una política UPDATE perquè el client pugui marcar/desmarcar
-- sessions com a penalitzades.

-- 1. Columna penalitzacio
alter table public.historial_sessions
    add column if not exists penalitzacio boolean not null default false;

-- 2. Política UPDATE (necessària perquè el client pugui aplicar/recuperar penalitzacions)
drop policy if exists "historial_sessions_update_all" on public.historial_sessions;

create policy "historial_sessions_update_all"
    on public.historial_sessions
    for update
    to anon, authenticated
    using (true)
    with check (true);
