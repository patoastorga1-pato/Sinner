import { SPACE_TYPES } from "@/lib/types/marketplace";
import type { HostCatalogOption, HostListing } from "@/lib/data-access/host";

function textValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function Field({ label, name, defaultValue, type = "text", required = true, min, max }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; min?: number; max?: number }) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        step={type === "number" ? "any" : undefined}
        defaultValue={textValue(defaultValue)}
        className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
      />
    </label>
  );
}

function TextArea({ label, name, defaultValue, rows = 4, required = false }: { label: string; name: string; defaultValue?: string | null; rows?: number; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
      />
    </label>
  );
}

function Toggle({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border hairline bg-black/20 px-4 text-sm text-sinner-mist">
      <span>{label}</span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-sinner-gold" />
    </label>
  );
}

function OptionGrid({ title, name, options, selected }: { title: string; name: string; options: HostCatalogOption[]; selected: string[] }) {
  return (
    <section>
      <p className="text-sm font-medium text-sinner-ivory">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-lg border hairline bg-black/20 px-3 text-sm text-sinner-mist">
            <input name={name} value={option.id} type="checkbox" defaultChecked={selected.includes(option.id)} className="h-4 w-4 accent-sinner-gold" />
            <span>{option.name}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export function HostListingForm({
  action,
  listing,
  amenities,
  allowedUses,
  returnPath,
}: {
  action: (formData: FormData) => void | Promise<void>;
  listing?: HostListing | null;
  amenities: HostCatalogOption[];
  allowedUses: HostCatalogOption[];
  returnPath: string;
}) {
  return (
    <form action={action} className="grid gap-8">
      <input type="hidden" name="return_path" value={returnPath} />
      {listing ? <input type="hidden" name="listing_id" value={listing.id} /> : null}

      <section className="premium-panel p-6 sm:p-8">
        <h2 className="font-display text-3xl text-sinner-ivory">Core details</h2>
        <div className="mt-6 grid gap-5">
          <Field label="Name" name="name" defaultValue={listing?.name} />
          <TextArea label="Short description" name="short_description" rows={3} defaultValue={listing?.shortDescription} />
          <TextArea label="Full description" name="description" rows={6} defaultValue={listing?.description} />
          <label className="grid gap-2 text-sm text-sinner-ivory">
            <span className="font-medium">Space type</span>
            <select name="space_type" defaultValue={listing?.spaceType ?? "other"} className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25">
              {SPACE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="premium-panel p-6 sm:p-8">
        <h2 className="font-display text-3xl text-sinner-ivory">Mexico location</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Country" name="country" defaultValue={listing?.country ?? "Mexico"} />
          <Field label="Country code" name="country_code" defaultValue={listing?.countryCode ?? "MX"} />
          <Field label="State" name="state" defaultValue={listing?.state} />
          <Field label="State code" name="state_code" defaultValue={listing?.stateCode} required={false} />
          <Field label="Municipality" name="municipality" defaultValue={listing?.municipality} required={false} />
          <Field label="City" name="city" defaultValue={listing?.city} />
          <Field label="Locality / neighborhood" name="locality" defaultValue={listing?.locality} required={false} />
          <Field label="Postal code" name="postal_code" required={false} />
          <Field label="Latitude" name="latitude" type="number" required={false} />
          <Field label="Longitude" name="longitude" type="number" required={false} />
        </div>
        <div className="mt-5 grid gap-5">
          <Field label="Public approximate location" name="approximate_location" defaultValue={listing?.approximateLocation} required={false} />
          <Field label={listing ? "Exact address (leave blank to keep protected address)" : "Exact address"} name="exact_address" required={false} />
        </div>
      </section>

      <section className="premium-panel p-6 sm:p-8">
        <h2 className="font-display text-3xl text-sinner-ivory">Pricing and capacity</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Hourly price" name="hourly_price" type="number" min={0} defaultValue={listing?.hourlyPrice} required={false} />
          <Field label="Overnight price" name="overnight_price" type="number" min={0} defaultValue={listing?.overnightPrice} required={false} />
          <Field label="Full day price" name="full_day_price" type="number" min={0} defaultValue={listing?.fullDayPrice} required={false} />
          <Field label="Cleaning fee" name="cleaning_fee" type="number" min={0} defaultValue={listing?.cleaningFee ?? 0} />
          <Field label="Max guests" name="max_guests" type="number" min={1} defaultValue={listing?.maxGuests ?? 2} />
          <Field label="Minimum hours" name="minimum_hours" type="number" min={1} defaultValue={listing?.minimumHours ?? 1} />
          <Field label="Privacy score" name="privacy_score" type="number" min={0} max={10} defaultValue={listing?.privacyScore} required={false} />
          <Field label="Minimum notice minutes" name="minimum_booking_notice_minutes" type="number" min={0} defaultValue={listing?.minimumBookingNoticeMinutes ?? 120} />
          <Field label="Buffer minutes" name="buffer_minutes" type="number" min={0} defaultValue={listing?.bufferMinutes ?? 30} />
        </div>
      </section>

      <section className="premium-panel p-6 sm:p-8">
        <h2 className="font-display text-3xl text-sinner-ivory">Rules and attributes</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Toggle label="Instant booking" name="instant_booking" defaultChecked={listing?.instantBooking} />
          <Toggle label="Creator friendly" name="creator_friendly" defaultChecked={listing?.creatorFriendly} />
          <Toggle label="Group friendly" name="group_friendly" defaultChecked={listing?.groupFriendly} />
          <Toggle label="Events allowed" name="events_allowed" defaultChecked={listing?.eventsAllowed} />
        </div>
        <div className="mt-6 grid gap-6">
          <OptionGrid title="Amenities" name="amenities" options={amenities} selected={listing?.amenityIds ?? []} />
          <OptionGrid title="Allowed uses" name="allowed_uses" options={allowedUses} selected={listing?.allowedUseIds ?? []} />
          <TextArea label="House rules (one per line)" name="house_rules" rows={5} defaultValue={listing?.rules.join("\n")} />
          <TextArea label="Cancellation policy" name="cancellation_policy" rows={4} defaultValue={listing?.cancellationPolicy} />
          <TextArea label="Check-in notes" name="check_in_notes" rows={4} defaultValue={listing?.checkInNotes} />
        </div>
      </section>

      <section className="premium-panel p-6 sm:p-8">
        <h2 className="font-display text-3xl text-sinner-ivory">Photos</h2>
        <p className="mt-3 text-sm leading-6 text-sinner-mist">Upload JPG, PNG, WEBP or GIF files. Exact address stays private; photos are public only after approval.</p>
        <input name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="mt-5 block w-full rounded-lg border hairline bg-black/35 px-4 py-3 text-sm text-sinner-mist file:mr-4 file:rounded-md file:border-0 file:bg-sinner-gold file:px-4 file:py-2 file:font-semibold file:text-black" />
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="submit" className="min-h-12 rounded-lg bg-sinner-gold px-5 font-semibold text-black transition hover:bg-sinner-goldSoft">Submit for review</button>
        <button type="submit" name="intent" value="draft" className="min-h-12 rounded-lg border hairline px-5 font-semibold text-sinner-mist transition hover:text-white">Save draft</button>
      </div>
    </form>
  );
}
