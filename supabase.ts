import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  // récupère l'URL de Supabase depuis les variables d'environnement
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // récupère la clé Supabase depuis les variables d'environnement

export const supabase = createClient(supabaseUrl, supabaseKey);  // crée client Supabase avec l'URL et la clé, puis l'exporte
