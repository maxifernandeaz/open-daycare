import type { CookieOptions } from "@supabase/ssr";

export const AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} satisfies CookieOptions;
