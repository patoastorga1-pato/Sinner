import { HeaderClient } from "@/components/HeaderClient";
import { getAuthState } from "@/lib/auth/server";

export async function Header() {
  const auth = await getAuthState();
  return <HeaderClient auth={auth} />;
}

