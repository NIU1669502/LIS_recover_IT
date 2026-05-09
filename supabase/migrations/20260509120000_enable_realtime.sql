-- ============================================================
-- Habilitar Supabase Realtime per a les taules necessàries
-- REPLICA IDENTITY FULL és necessari perquè els filtres de
-- postgres_changes funcionin correctament amb la clau anonima
-- ============================================================

-- Taules subscrites des del frontend
ALTER TABLE public.diagnostic          REPLICA IDENTITY FULL;
ALTER TABLE public.relacio_fisio_pacient REPLICA IDENTITY FULL;
ALTER TABLE public.historial_sessions  REPLICA IDENTITY FULL;

-- Afegir les taules a la publicació de realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relacio_fisio_pacient;
ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_sessions;
