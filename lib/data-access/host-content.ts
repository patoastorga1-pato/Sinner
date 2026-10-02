import { createClient } from "@/lib/supabase/server";
import type { ListingStatus } from "@/lib/types/database";

type Row = Record<string, unknown>;
const rows = (value: unknown) => Array.isArray(value) ? value as Row[] : [];
const object = (value: unknown) => value && typeof value === "object" ? (Array.isArray(value) ? value[0] as Row | undefined : value as Row) : undefined;

export type HostExperience = {
  id: string; name: string; slug: string; shortDescription: string; description: string; categoryIds: string[];
  city: string; state: string; country: string; municipality: string; locality: string; exactAddress: string;
  approximateLocation: string; durationMinutes: number; maxGuests: number; price: number; currency: string;
  minimumAge: number; cancellationPolicy: string; requirements: string; included: string; status: ListingStatus; cover: string | null;
  sessions: Array<{id:string;startsAt:string;endsAt:string;capacity:number;reservedCount:number;status:string}>;
};
export type HostEvent = {
  id: string; name: string; slug: string; shortDescription: string; description: string; category: string;
  city: string; state: string; country: string; municipality: string; locality: string; exactAddress: string;
  approximateLocation: string; venueName: string; eventDate: string; startTime: string; endTime: string;
  doorsOpenTime: string; capacity: number; visibility: string; minimumAge: number; cancellationPolicy: string;
  houseRules: string; status: ListingStatus; cover: string | null;
  ticketTypes: Array<{ id: string; name: string; description: string; price: number; quantityTotal: number; quantitySold: number; maxPerOrder: number }>;
};
export type ExperienceCategory = { id: string; name: string; slug: string };

function mediaUrl(path: unknown) {
  const value = String(path ?? "");
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/listing-media/${value}` : null;
}

export async function getExperienceCategories(): Promise<ExperienceCategory[]> {
  const supabase = await createClient(); if (!supabase) return [];
  const { data } = await supabase.from("experience_categories").select("id,name,slug").eq("active", true).order("sort_order");
  return rows(data).map((row) => ({ id: String(row.id), name: String(row.name), slug: String(row.slug) }));
}

export async function getHostExperiences(): Promise<HostExperience[]> {
  const supabase = await createClient(); if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return [];
  const { data } = await supabase.from("experiences").select(`*,experience_category_links(category_id),experience_media(id,storage_path,is_cover,sort_order),experience_sessions(id,starts_at,ends_at,capacity,reserved_count,status)`).eq("host_id", auth.user.id).order("created_at", { ascending: false });
  return rows(data).map((row) => {
    const media = rows(row.experience_media).sort((a,b) => Number(a.sort_order)-Number(b.sort_order));
    const cover = media.find((item) => item.is_cover) ?? media[0];
    return { id:String(row.id), name:String(row.name), slug:String(row.slug), shortDescription:String(row.short_description??""), description:String(row.description??""), categoryIds:rows(row.experience_category_links).map(x=>String(x.category_id)), city:String(row.city??""), state:String(row.state??""), country:String(row.country??"Mexico"), municipality:String(row.municipality??""), locality:String(row.locality??""), exactAddress:String(row.exact_address??""), approximateLocation:String(row.approximate_location??""), durationMinutes:Number(row.duration_minutes??60), maxGuests:Number(row.max_guests??1), price:Number(row.price??0), currency:String(row.currency??"MXN"), minimumAge:Number(row.minimum_age??18), cancellationPolicy:String(row.cancellation_policy??""), requirements:String(row.requirements??""), included:String(row.what_is_included??""), status:String(row.status) as ListingStatus, cover:mediaUrl(cover?.storage_path),sessions:rows(row.experience_sessions).map(x=>({id:String(x.id),startsAt:String(x.starts_at),endsAt:String(x.ends_at),capacity:Number(x.capacity),reservedCount:Number(x.reserved_count),status:String(x.status)})) };
  });
}

export async function getHostEvents(): Promise<HostEvent[]> {
  const supabase = await createClient(); if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return [];
  const { data } = await supabase.from("events").select(`*,event_media(id,storage_path,is_cover,sort_order),event_ticket_types(id,name,description,price,quantity_total,quantity_sold,max_per_order,sort_order)`).eq("organizer_id", auth.user.id).order("event_date", { ascending: false });
  return rows(data).map((row) => {
    const media = rows(row.event_media).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)); const cover=media.find(x=>x.is_cover)??media[0];
    return { id:String(row.id), name:String(row.name), slug:String(row.slug), shortDescription:String(row.short_description??""), description:String(row.description??""), category:String(row.category??"other"), city:String(row.city??""), state:String(row.state??""), country:String(row.country??"Mexico"), municipality:String(row.municipality??""), locality:String(row.locality??""), exactAddress:String(row.exact_address??""), approximateLocation:String(row.approximate_location??""), venueName:String(row.venue_name??""), eventDate:String(row.event_date??""), startTime:String(row.start_time??"").slice(0,5), endTime:String(row.end_time??"").slice(0,5), doorsOpenTime:String(row.doors_open_time??"").slice(0,5), capacity:Number(row.capacity??1), visibility:String(row.visibility??"public"), minimumAge:Number(row.minimum_age??18), cancellationPolicy:String(row.cancellation_policy??""), houseRules:String(row.house_rules??""), status:String(row.status) as ListingStatus, cover:mediaUrl(cover?.storage_path), ticketTypes:rows(row.event_ticket_types).sort((a,b)=>Number(a.sort_order)-Number(b.sort_order)).map(t=>({id:String(t.id),name:String(t.name),description:String(t.description??""),price:Number(t.price),quantityTotal:Number(t.quantity_total),quantitySold:Number(t.quantity_sold),maxPerOrder:Number(t.max_per_order)})) };
  });
}

export async function getHostExperience(id: string) { return (await getHostExperiences()).find(item => item.id === id) ?? null; }
export async function getHostEvent(id: string) { return (await getHostEvents()).find(item => item.id === id) ?? null; }
