import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const authenticatedPrefixes = ["/profile", "/settings", "/favorites", "/bookings", "/messages", "/notifications", "/checkout"];
const hostPrefixes = ["/host/dashboard", "/host/listings", "/host/bookings", "/host/calendar", "/host/messages", "/host/earnings"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const requiresUser = matchesPrefix(pathname, authenticatedPrefixes) || pathname === "/host/onboarding" || matchesPrefix(pathname, hostPrefixes) || pathname === "/admin" || pathname.startsWith("/admin/");

  if (requiresUser && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRole = pathname === "/admin" || pathname.startsWith("/admin/") ? "admin" : matchesPrefix(pathname, hostPrefixes) ? "host" : null;
  if (user && supabase && requiredRole) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", requiredRole).maybeSingle();

    if (!data) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = requiredRole === "host" ? "/host/onboarding" : "/";
      deniedUrl.search = "";
      deniedUrl.searchParams.set("error", `${requiredRole === "host" ? "Host" : "Admin"} access required.`);
      return NextResponse.redirect(deniedUrl);
    }
  }

  if (user && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
