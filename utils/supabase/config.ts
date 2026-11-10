const MISSING_URL_ERROR =
  "Falta NEXT_PUBLIC_SUPABASE_URL en la configuración del entorno.";
const MISSING_PUBLISHABLE_KEY_ERROR =
  "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en la configuración del entorno.";

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(MISSING_URL_ERROR);
  }

  return url;
}

export function getSupabasePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(MISSING_PUBLISHABLE_KEY_ERROR);
  }

  return key;
}
