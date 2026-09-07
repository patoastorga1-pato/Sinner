import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config/env";
import { createClient, hasSupabaseAuthCookie } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";

export type AuthState = {
  user: { id: string; email: string | null } | null;
  profile: Pick<Profile, "first_name" | "last_name" | "display_name" | "avatar_url"> | null;
  roles: UserRole[];
  unreadNotifications: number;
  configured: boolean;
};

export type AuthenticatedState = Omit<AuthState, "user"> & { user: NonNullable<AuthState["user"]> };

export async function getAuthState(): Promise<AuthState> {
  if (isSupabaseConfigured() && !(await hasSupabaseAuthCookie())) {
    return { user: null, profile: null, roles: [], unreadNotifications: 0, configured: true };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { user: null, profile: null, roles: [], unreadNotifications: 0, configured: false };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return { user: null, profile: null, roles: [], unreadNotifications: 0, configured: true };
  }

  const [profileResult, rolesResult, notificationResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name,last_name,display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: (profileResult.data as AuthState["profile"]) ?? null,
    roles: (rolesResult.data?.map((item) => item.role) ?? []) as UserRole[],
    unreadNotifications: notificationResult.count ?? 0,
    configured: true,
  };
}

export async function requireUser(redirectPath: string): Promise<AuthenticatedState> {
  const state = await getAuthState();

  if (!state.user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return state as AuthenticatedState;
}

export async function requireRole(role: UserRole, redirectPath: string) {
  const state = await requireUser(redirectPath);

  if (!state.roles.includes(role)) {
    redirect(role === "host" ? "/host/onboarding?error=Host+access+required." : "/?error=Access+denied.");
  }

  return state;
}
