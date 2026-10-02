"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { withMessage } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string, fallback = 0) => { const value = Number(form.get(key)); return Number.isFinite(value) ? value : fallback; };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

async function hostClient(path: string) {
  const auth = await requireRole("host", path); const supabase = await createClient();
  if (!supabase) redirect(withMessage(path, "error", "Supabase is not configured."));
  return { auth, supabase };
}

async function uploadMedia(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string, kind: "experience"|"event", id: string, files: File[]) {
  const paths: string[] = [];
  for (const file of files.slice(0, 10)) {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) continue;
    const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const path = `${userId}/${kind}/${id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("listing-media").upload(path, file, { contentType: file.type, upsert: false });
    if (!error) paths.push(path);
  }
  return paths;
}

export async function saveHostExperienceAction(formData: FormData) {
  const returnPath = "/host/experiences"; const { auth, supabase } = await hostClient(returnPath);
  const id = text(formData, "id"); const name = text(formData, "name"); const intent = text(formData, "intent");
  if (!name || !text(formData,"description") || !text(formData,"city") || !text(formData,"state")) redirect(withMessage(id?`/host/experiences/${id}/edit`:"/host/experiences/new", "error", "Complete name, description and location."));
  const payload = { host_id: auth.user.id, name, slug: `${slugify(name)}-${(id || crypto.randomUUID()).slice(0,8)}`, short_description:text(formData,"short_description")||null, description:text(formData,"description"), city:text(formData,"city"), state:text(formData,"state"), country:"Mexico", municipality:text(formData,"municipality")||null, locality:text(formData,"locality")||null, exact_address:text(formData,"exact_address")||null, approximate_location:text(formData,"approximate_location")||null, duration_minutes:number(formData,"duration_minutes",60), max_guests:number(formData,"max_guests",2), price:number(formData,"price"), currency:"MXN", minimum_age:Math.max(18,number(formData,"minimum_age",18)), cancellation_policy:text(formData,"cancellation_policy")||null, requirements:text(formData,"requirements")||null, what_is_included:text(formData,"what_is_included")||null, status:intent==="submit"?"pending_review":"draft" };
  const result = id ? await supabase.from("experiences").update(payload).eq("id",id).eq("host_id",auth.user.id).select("id").single() : await supabase.from("experiences").insert(payload).select("id").single();
  if (result.error) redirect(withMessage(id?`/host/experiences/${id}/edit`:"/host/experiences/new","error",result.error.message));
  const savedId=String(result.data.id); const categoryIds=formData.getAll("categories").map(String);
  await supabase.from("experience_category_links").delete().eq("experience_id",savedId);
  if(categoryIds.length) await supabase.from("experience_category_links").insert(categoryIds.map(category_id=>({experience_id:savedId,category_id})));
  const files=formData.getAll("photos").filter((item):item is File=>item instanceof File&&item.size>0); const paths=await uploadMedia(supabase,auth.user.id,"experience",savedId,files);
  if(paths.length) await supabase.from("experience_media").insert(paths.map((storage_path,index)=>({experience_id:savedId,storage_path,sort_order:index,is_cover:index===0})));
  const starts=text(formData,"session_starts_at"),ends=text(formData,"session_ends_at");
  if(starts&&ends){const session={experience_id:savedId,starts_at:new Date(starts).toISOString(),ends_at:new Date(ends).toISOString(),capacity:number(formData,"session_capacity",payload.max_guests)};const{data:existing}=await supabase.from("experience_sessions").select("id").eq("experience_id",savedId).order("starts_at").limit(1).maybeSingle();if(existing)await supabase.from("experience_sessions").update(session).eq("id",existing.id);else await supabase.from("experience_sessions").insert(session);}
  revalidatePath("/host/experiences"); revalidatePath("/experiences"); redirect(withMessage(returnPath,"success",intent==="submit"?"Experience submitted for review.":"Experience draft saved."));
}

export async function saveHostEventAction(formData: FormData) {
  const returnPath="/host/events"; const {auth,supabase}=await hostClient(returnPath); const id=text(formData,"id"); const name=text(formData,"name"); const intent=text(formData,"intent");
  if(!name||!text(formData,"description")||!text(formData,"event_date")||!text(formData,"start_time")||!text(formData,"end_time")) redirect(withMessage(id?`/host/events/${id}/edit`:"/host/events/new","error","Complete event name, description, date and schedule."));
  const ticketPrice=number(formData,"ticket_price"); const payload={organizer_id:auth.user.id,name,slug:`${slugify(name)}-${(id||crypto.randomUUID()).slice(0,8)}`,short_description:text(formData,"short_description")||null,description:text(formData,"description"),category:text(formData,"category")||"other",city:text(formData,"city"),state:text(formData,"state"),country:"Mexico",municipality:text(formData,"municipality")||null,locality:text(formData,"locality")||null,exact_address:text(formData,"exact_address")||null,approximate_location:text(formData,"locality")||text(formData,"city"),venue_name:text(formData,"venue_name")||null,event_date:text(formData,"event_date"),start_time:text(formData,"start_time"),end_time:text(formData,"end_time"),doors_open_time:text(formData,"doors_open_time")||null,capacity:number(formData,"capacity",1),ticket_price:ticketPrice,currency:"MXN",visibility:text(formData,"visibility")||"public",minimum_age:Math.max(18,number(formData,"minimum_age",18)),cancellation_policy:text(formData,"cancellation_policy")||null,house_rules:text(formData,"house_rules")||null,status:intent==="submit"?"pending_review":"draft"};
  const result=id?await supabase.from("events").update(payload).eq("id",id).eq("organizer_id",auth.user.id).select("id").single():await supabase.from("events").insert(payload).select("id").single();
  if(result.error) redirect(withMessage(id?`/host/events/${id}/edit`:"/host/events/new","error",result.error.message)); const savedId=String(result.data.id);
  const ticket={event_id:savedId,name:text(formData,"ticket_name")||"General Admission",description:null,price:ticketPrice,currency:"MXN",quantity_total:number(formData,"ticket_quantity",payload.capacity),max_per_order:number(formData,"max_per_order",6),sort_order:0};
  const {data:existing}=await supabase.from("event_ticket_types").select("id").eq("event_id",savedId).order("sort_order").limit(1).maybeSingle();
  if(existing) await supabase.from("event_ticket_types").update(ticket).eq("id",existing.id); else await supabase.from("event_ticket_types").insert(ticket);
  const secondName=text(formData,"ticket_name_2");if(secondName){const second={event_id:savedId,name:secondName,description:null,price:number(formData,"ticket_price_2"),currency:"MXN",quantity_total:number(formData,"ticket_quantity_2",1),max_per_order:number(formData,"max_per_order_2",4),sort_order:1};const{data:existingSecond}=await supabase.from("event_ticket_types").select("id").eq("event_id",savedId).eq("sort_order",1).maybeSingle();if(existingSecond)await supabase.from("event_ticket_types").update(second).eq("id",existingSecond.id);else await supabase.from("event_ticket_types").insert(second);}
  const files=formData.getAll("photos").filter((item):item is File=>item instanceof File&&item.size>0); const paths=await uploadMedia(supabase,auth.user.id,"event",savedId,files);
  if(paths.length) await supabase.from("event_media").insert(paths.map((storage_path,index)=>({event_id:savedId,storage_path,sort_order:index,is_cover:index===0})));
  revalidatePath("/host/events"); revalidatePath("/events"); redirect(withMessage(returnPath,"success",intent==="submit"?"Event submitted for review.":"Event draft saved."));
}
