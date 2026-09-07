import { searchMexicoLocations } from "@/lib/data-access/locations";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const suggestions = await searchMexicoLocations(query);

  return Response.json(suggestions, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
