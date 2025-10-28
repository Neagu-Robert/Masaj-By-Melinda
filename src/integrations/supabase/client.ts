
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required. Make sure to create a .env.local file in the root of the project with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.')
}

// Supabase client with public project details
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
