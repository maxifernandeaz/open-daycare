import { NextResponse, type NextRequest } from "next/server";
import {
  createClient,
  type MiddlewareSession,
} from "@/utils/supabase/middleware";

const PUBLIC_ROUTES = new Set(["/login", "/activar-cuenta"]);

const redirectTo = (
  request: NextRequest,
  pathname: string,
  session: MiddlewareSession,
) => {
  const response = NextResponse.redirect(new URL(pathname, request.url));

  session.cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  Object.entries(session.cacheHeaders).forEach(([key, value]) =>
    response.headers.set(key, value),
  );

  return response;
};

export async function proxy(request: NextRequest) {
  const session = await createClient(request);
  const { pathname } = request.nextUrl;

  if (!session.userId && !PUBLIC_ROUTES.has(pathname)) {
    return redirectTo(request, "/login", session);
  }

  if (session.userId && pathname === "/login") {
    return redirectTo(request, "/", session);
  }

  return session.response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
