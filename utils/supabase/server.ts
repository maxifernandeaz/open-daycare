import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/utils/supabase/config";
import { AUTH_COOKIE_OPTIONS } from "@/utils/supabase/cookie-options";

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) =>
  createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: ignored when Proxy refreshes sessions.
        }
      },
    },
  });
