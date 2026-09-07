import { NextResponse } from "next/server";
import { z } from "zod";
import { getSpaceAvailability } from "@/lib/data-access/marketplace";

const selectionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  duration: z.number().int().min(1).max(24),
  guests: z.number().int().min(1).max(30),
  mode: z.enum(["hourly", "overnight", "full-day"]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, body] = await Promise.all([params, request.json()]);
    const parsed = selectionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ available: false, reason: "invalid", message: "Choose a valid date, time, duration and guest count." }, { status: 400 });
    const result = await getSpaceAvailability(id, parsed.data);
    return NextResponse.json(result, { status: result.available ? 200 : 409 });
  } catch {
    return NextResponse.json({ available: false, reason: "invalid", message: "Availability could not be checked." }, { status: 500 });
  }
}
