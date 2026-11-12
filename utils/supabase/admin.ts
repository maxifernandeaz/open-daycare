import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseUrl } from "@/utils/supabase/config";

const MISSING_CONFIG_ERROR =
  "Configuración incompleta: falta SUPABASE_SERVICE_ROLE_KEY en el servidor.";

export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(MISSING_CONFIG_ERROR);
  }

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
