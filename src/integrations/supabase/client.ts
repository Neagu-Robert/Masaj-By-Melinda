
import { createClient } from '@supabase/supabase-js'

// Supabase client with public project details
export const supabase = createClient(
  'https://dgzmqlwqlfmdbnwqjjjr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem1xbHdxbGZtZGJud3FqampyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODcxNDYsImV4cCI6MjA2MTI2MzE0Nn0.Y7sKLnfvQh3t6hoH_TyTVxojWUuKhgwW965Q9cE8pZs'
)
