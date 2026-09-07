"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config/env";

let browserClient: SupabaseClient | null = null;

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createBrowserClient(config.url, config.key);
  return browserClient;
}

