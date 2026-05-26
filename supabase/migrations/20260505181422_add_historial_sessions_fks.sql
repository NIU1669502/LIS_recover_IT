-- with lesions and diagnostic in schema cache.

do $$
begin
    if not exists (
        select 1
        from information_schema.table_constraints
        where constraint_schema = 'public'
          and table_name = 'historial_sessions'
          and constraint_name = 'historial_sessions_id_lesio_fkey'
    ) then
        alter table public.historial_sessions
            add constraint historial_sessions_id_lesio_fkey
            foreign key (id_lesio)
            references public.lesions (id_lesio)
            on update cascade
            on delete restrict;
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from information_schema.table_constraints
        where constraint_schema = 'public'
          and table_name = 'historial_sessions'
          and constraint_name = 'historial_sessions_id_diagnostic_fkey'
    ) then
        alter table public.historial_sessions
            add constraint historial_sessions_id_diagnostic_fkey
            foreign key (id_diagnostic)
            references public.diagnostic (id_diagnostic)
            on update cascade
            on delete cascade;
    end if;
end $$;
