-- postgres_changes funcionin correctament amb la clau anonima

ALTER TABLE public.diagnostic          REPLICA IDENTITY FULL;
ALTER TABLE public.relacio_fisio_pacient REPLICA IDENTITY FULL;
ALTER TABLE public.historial_sessions  REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relacio_fisio_pacient;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_sessions;
