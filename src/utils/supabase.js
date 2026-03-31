import { createClient } from '@supabase/supabase-js';

// Aquestes URL i API KEY les trobareu al dashboard de Supabase del projecte
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Falten variables de Supabase. Defineix NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) a .env.local'
  );
}

// Exportem el client per poder-lo fer servir a qualsevol part de l'app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
