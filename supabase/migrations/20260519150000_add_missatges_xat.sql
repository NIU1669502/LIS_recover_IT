-- Migration: missatges_xat — xat en directe pacient ↔ fisioterapeuta
-- Només té sentit quan existeix relacio_fisio_pacient confirmada (validat a l'app).

create table if not exists public.missatges_xat (
    id_missatge   bigserial primary key,
    dni_fisio     text not null,
    dni_pacient   text not null,
    remitent_dni  text not null,
    contingut     text not null,
    enviat_en     timestamptz not null default now(),
    constraint missatges_xat_contingut_no_buit
        check (char_length(trim(contingut)) > 0),
    constraint missatges_xat_contingut_max
        check (char_length(contingut) <= 2000)
);

create index if not exists idx_missatges_xat_conversa
    on public.missatges_xat (dni_fisio, dni_pacient, enviat_en desc);

create index if not exists idx_missatges_xat_fisio
    on public.missatges_xat (dni_fisio);

create index if not exists idx_missatges_xat_pacient
    on public.missatges_xat (dni_pacient);

alter table public.missatges_xat enable row level security;

drop policy if exists "missatges_xat_select_all" on public.missatges_xat;
drop policy if exists "missatges_xat_insert_all" on public.missatges_xat;

create policy "missatges_xat_select_all"
    on public.missatges_xat
    for select
    to anon, authenticated
    using (true);

create policy "missatges_xat_insert_all"
    on public.missatges_xat
    for insert
    to anon, authenticated
    with check (true);

-- Realtime (mateix patró que la resta de taules de l'app)
alter table public.missatges_xat replica identity full;

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'missatges_xat'
    ) then
        alter publication supabase_realtime add table public.missatges_xat;
    end if;
end $$;
