/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTHENTICATION_URL: string;
  readonly VITE_API_ROOT: string;
  readonly VITE_AUTHENTICATION_ROOT: string;
  readonly VITE_ITEMS_PER_PAGE: number;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}