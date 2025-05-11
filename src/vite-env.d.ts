/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string; // The base URL of the API
  readonly VITE_SUPABASE_ANON_KEY: string; // The API key for authentication
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}