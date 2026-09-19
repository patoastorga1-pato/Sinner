import { AdminChrome } from "@/components/admin/AdminChrome";
import { requireRole } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireRole("admin", "/admin");
  return <AdminChrome auth={auth}>{children}</AdminChrome>;
}
