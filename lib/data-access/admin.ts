import { createClient } from "@/lib/supabase/server";
import type { HostApplicationRecord, HostApplicationStatus, Profile } from "@/lib/types/database";

type ProfileSummary = Pick<Profile, "id" | "first_name" | "last_name" | "display_name" | "created_at">;

export type AdminHostApplication = HostApplicationRecord & {
  profile: ProfileSummary | null;
};

const hostApplicationSelect = "id,user_id,status,applicant_email,request_note,decision_note,reviewed_by,reviewed_at,requested_at,updated_at";

export async function getAdminHostApplications() {
  const supabase = await createClient();
  if (!supabase) return [] as AdminHostApplication[];

  const { data } = await supabase
    .from("host_applications")
    .select(hostApplicationSelect)
    .order("requested_at", { ascending: false });

  const applications = (data ?? []) as HostApplicationRecord[];
  const userIds = Array.from(new Set(applications.map((application) => application.user_id)));
  const profilesById = new Map<string, ProfileSummary>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,display_name,created_at")
      .in("id", userIds);

    ((profiles ?? []) as ProfileSummary[]).forEach((profile) => profilesById.set(profile.id, profile));
  }

  return applications.map((application) => ({
    ...application,
    profile: profilesById.get(application.user_id) ?? null,
  }));
}

export async function getHostApplicationCounts() {
  const applications = await getAdminHostApplications();
  const statuses: HostApplicationStatus[] = ["pending", "approved", "rejected", "suspended"];
  return Object.fromEntries(statuses.map((status) => [status, applications.filter((application) => application.status === status).length])) as Record<HostApplicationStatus, number>;
}
