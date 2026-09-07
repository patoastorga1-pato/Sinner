import { createClient } from "@/lib/supabase/server";
import {
  mexicoLocationDataset,
  normalizeMexicoLocation,
  type LocationAutocompleteProvider,
  type LocationSuggestion,
} from "@/lib/locations/mexico";

type LocationRpcRow = {
  label?: unknown;
  locality?: unknown;
  city?: unknown;
  municipality?: unknown;
  state?: unknown;
  state_code?: unknown;
  country_code?: unknown;
};

const staticMexicoProvider: LocationAutocompleteProvider = {
  async search(query, limit) {
    const normalizedQuery = normalizeMexicoLocation(query);
    return mexicoLocationDataset
      .filter((location) => normalizeMexicoLocation(`${location.label} ${location.stateCode}`).includes(normalizedQuery))
      .slice(0, limit);
  },
};

const supabaseListingProvider: LocationAutocompleteProvider = {
  async search(query, limit) {
    const supabase = await createClient();
    if (!supabase) return [];

    const { data, error } = await supabase.rpc("search_mexico_locations", {
      p_query: query,
      p_limit: limit,
    });
    if (error || !Array.isArray(data)) return [];

    return (data as LocationRpcRow[]).map((row) => ({
      label: String(row.label ?? ""),
      locality: row.locality ? String(row.locality) : null,
      city: String(row.city ?? ""),
      municipality: row.municipality ? String(row.municipality) : null,
      state: String(row.state ?? ""),
      stateCode: String(row.state_code ?? ""),
      countryCode: "MX" as const,
    }));
  },
};

const locationProviders: LocationAutocompleteProvider[] = [supabaseListingProvider, staticMexicoProvider];

export async function searchMexicoLocations(query: string, limit = 8) {
  const normalizedQuery = normalizeMexicoLocation(query).slice(0, 120);
  if (normalizedQuery.length < 2) return [];

  const providerResults = await Promise.all(
    locationProviders.map((provider) => provider.search(normalizedQuery, limit)),
  );
  const unique = new Map<string, LocationSuggestion>();

  for (const result of providerResults.flat()) {
    const key = normalizeMexicoLocation(result.label);
    if (key && !unique.has(key)) unique.set(key, result);
  }

  return Array.from(unique.values()).slice(0, Math.min(Math.max(limit, 1), 12));
}
