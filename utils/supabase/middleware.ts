import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/utils/supabase/config";
import { AUTH_COOKIE_OPTIONS } from "@/utils/supabase/cookie-options";

export type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type MiddlewareSession = {
  response: NextResponse;
  userId: string | null;
  cookiesToSet: CookieToSet[];
  cacheHeaders: Record<string, string>;
};

export const createClient = async (
  request: NextRequest,
): Promise<MiddlewareSession> => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  let cookiesToSet: CookieToSet[] = [];
  const cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookiesToSet, headers) {
          cookiesToSet = newCookiesToSet;
          newCookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          newCookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.assign(cacheHeaders, headers);
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and auth calls: it refreshes
  // the session and writes the updated cookies on the response.
  const { data } = await supabase.auth.getClaims();
  const userId =
    typeof data?.claims.sub === "string" ? data.claims.sub : null;

  return { response: supabaseResponse, userId, cookiesToSet, cacheHeaders };
};
