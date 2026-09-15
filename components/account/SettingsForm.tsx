"use client";

import { useEffect, useRef, useState } from "react";
import { Download, EyeOff, ImagePlus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateSettingsAction } from "@/app/actions/auth";
import type { Profile, UserPreferenceRecord } from "@/lib/types/database";

type Preferences = Omit<UserPreferenceRecord, "user_id" | "created_at" | "updated_at">;

const bioLimit = 300;

const mexicoTimezones = [
  ["", "Optional"],
  ["America/Mexico_City", "Central Mexico"],
  ["America/Cancun", "Quintana Roo"],
  ["America/Monterrey", "Nuevo Leon"],
  ["America/Merida", "Yucatan"],
  ["America/Bahia_Banderas", "Bahia de Banderas"],
  ["America/Mazatlan", "Pacific Mexico"],
  ["America/Chihuahua", "Chihuahua"],
  ["America/Hermosillo", "Sonora"],
  ["America/Tijuana", "Baja California"],
  ["America/Ciudad_Juarez", "Ciudad Juarez"],
] as const;

const notificationRows = [
  ["reservations", "Reservations"],
  ["messages", "Messages"],
  ["verification", "Verification"],
  ["payments", "Payments"],
  ["security", "Security updates"],
] as const;

function Field({
  label,
  name,
  defaultValue,
  required = true,
  note,
  autoComplete,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  note?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        autoComplete={autoComplete}
        className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
      />
      {note ? <span className="text-xs leading-5 text-sinner-mist/70">{note}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25">
        {children}
      </select>
    </label>
  );
}

function Toggle({ name, label, defaultChecked, description }: { name: string; label: string; defaultChecked: boolean; description?: string }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border hairline bg-black/20 px-4 py-3 text-sm">
      <span>
        <span className="block font-medium text-sinner-ivory">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-sinner-mist">{description}</span> : null}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full border border-white/10 bg-white/[0.08] transition peer-checked:border-sinner-gold/30 peer-checked:bg-sinner-gold/80">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-sinner-mist transition peer-checked:translate-x-5 peer-checked:bg-sinner-black" />
      </span>
    </label>
  );
}

function CompactToggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="grid cursor-pointer place-items-center" aria-label={label}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full border border-white/10 bg-white/[0.08] transition peer-checked:border-sinner-gold/30 peer-checked:bg-sinner-gold/80">
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-sinner-mist transition peer-checked:translate-x-5 peer-checked:bg-sinner-black" />
      </span>
    </label>
  );
}

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="min-h-11 rounded-lg bg-sinner-gold px-5 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft disabled:cursor-not-allowed disabled:opacity-55"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [continued, setContinued] = useState(false);

  useEffect(() => {
    if (!open) setContinued(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 px-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-lg rounded-2xl border hairline bg-sinner-black p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase text-sinner-goldSoft">Account & Privacy</p>
            <h2 id="delete-account-title" className="mt-2 font-display text-3xl text-sinner-ivory">Delete your account?</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border hairline text-sinner-mist"><X size={18} /></button>
        </div>
        <p className="mt-5 text-sm leading-6 text-sinner-mist">This action may permanently remove your profile and access to your SINNER account.</p>
        <ul className="mt-5 grid gap-3 text-sm text-sinner-mist">
          <li className="rounded-lg border hairline bg-black/20 px-4 py-3">Active reservations must be resolved.</li>
          <li className="rounded-lg border hairline bg-black/20 px-4 py-3">Pending payments or refunds must be completed.</li>
          <li className="rounded-lg border hairline bg-black/20 px-4 py-3">Some records may need to be retained where legally required.</li>
        </ul>
        {continued ? (
          <p className="mt-5 rounded-lg border border-sinner-gold/20 bg-sinner-gold/5 px-4 py-3 text-sm leading-6 text-sinner-goldSoft">
            For your protection, permanent deletion requires reauthentication and a support review before anything is removed.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-sinner-ivory">Cancel</button>
          <button type="button" onClick={() => setContinued(true)} className="min-h-11 rounded-lg bg-sinner-gold px-4 text-sm font-semibold text-black transition hover:bg-sinner-goldSoft">Continue</button>
        </div>
      </section>
    </div>
  );
}

export function SettingsForm({ profile, preferences }: { profile: Profile | null; preferences: Preferences }) {
  const formRef = useRef<HTMLFormElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [dirty, setDirty] = useState(false);
  const [bioCount, setBioCount] = useState(profile?.bio?.length ?? 0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const confirmLeave = "You have unsaved changes. Leave anyway?";
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = confirmLeave;
    };
    const onClick = (event: MouseEvent) => {
      if (!dirty) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(confirmLeave)) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  function markDirty() {
    setDirty(true);
  }

  function discardChanges() {
    formRef.current?.reset();
    setDirty(false);
    setBioCount(profile?.bio?.length ?? 0);
    setAvatarPreview(profile?.avatar_url ?? null);
    setRemoveAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function onAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    markDirty();
  }

  function removePhoto() {
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setAvatarPreview(null);
    setRemoveAvatar(true);
    markDirty();
  }

  return (
    <>
      <form ref={formRef} action={updateSettingsAction} onChange={markDirty} className="grid gap-7">
        <input type="hidden" name="removeAvatar" value={removeAvatar ? "true" : "false"} />

        <section className="premium-panel p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex flex-col items-center gap-4 md:w-48 md:items-start">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-sinner-gold/25 bg-sinner-gold/10 text-sinner-goldSoft">
                {avatarPreview ? <img src={avatarPreview} alt="Profile avatar preview" className="h-full w-full object-cover" /> : <UserRound size={42} />}
              </div>
              <input ref={avatarInputRef} type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onAvatarChange} />
              <div className="grid w-full gap-2">
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sinner-gold/25 px-3 text-sm font-semibold text-sinner-goldSoft transition hover:bg-sinner-gold/10">
                  <ImagePlus size={16} />
                  Change photo
                </button>
                <button type="button" onClick={removePhoto} disabled={!avatarPreview && !profile?.avatar_url} className="min-h-10 rounded-lg border hairline px-3 text-sm text-sinner-mist transition hover:text-sinner-ivory disabled:cursor-not-allowed disabled:opacity-45">
                  Remove photo
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3"><UserRound size={19} className="text-sinner-goldSoft" /><h2 className="font-display text-3xl text-sinner-ivory">Profile</h2></div>
              <div className="mt-6 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name" name="firstName" defaultValue={profile?.first_name} autoComplete="given-name" note="Private account information." />
                  <Field label="Last name" name="lastName" defaultValue={profile?.last_name} autoComplete="family-name" note="Private account information." />
                </div>
                <Field label="Display name" name="displayName" required={false} defaultValue={profile?.display_name} note="This is the name other users may see." />
                <label className="grid gap-2 text-sm text-sinner-ivory">
                  <span className="font-medium">Bio</span>
                  <textarea
                    name="bio"
                    defaultValue={profile?.bio ?? ""}
                    maxLength={bioLimit}
                    rows={5}
                    onInput={(event) => setBioCount(event.currentTarget.value.length)}
                    className="rounded-lg border hairline bg-black/35 px-4 py-3 text-white outline-none transition focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
                  />
                  <span className="text-right text-xs text-sinner-mist/70">{bioCount} / {bioLimit}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="premium-panel p-6 sm:p-8">
          <h2 className="font-display text-3xl text-sinner-ivory">Preferences</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <SelectField label="Language" name="language" defaultValue={preferences.language}>
              <option value="es-MX">Español (México)</option>
              <option value="en">English</option>
            </SelectField>
            <SelectField label="Currency" name="currency" defaultValue={preferences.currency}>
              <option value="MXN">MXN — Mexican Peso</option>
            </SelectField>
            <SelectField label="Time zone" name="timezone" defaultValue={preferences.timezone ?? ""}>
              {mexicoTimezones.map(([value, label]) => <option key={value || "optional"} value={value}>{label}</option>)}
            </SelectField>
          </div>
        </section>

        <section className="premium-panel p-6 sm:p-8">
          <h2 className="font-display text-3xl text-sinner-ivory">Notification preferences</h2>
          <div className="mt-6 overflow-hidden rounded-xl border hairline">
            <div className="grid grid-cols-[minmax(0,1fr)_88px_88px] border-b hairline bg-black/20 px-4 py-3 text-xs font-semibold uppercase text-sinner-mist">
              <span>Category</span>
              <span className="text-center">Email</span>
              <span className="text-center">In-app</span>
            </div>
            {notificationRows.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_88px_88px] items-center gap-3 border-b hairline px-4 py-4 last:border-b-0">
                <span className="text-sm font-medium text-sinner-ivory">{label}</span>
                <div className="grid place-items-center"><CompactToggle name={`email_${key}`} label={`${label} email notifications`} defaultChecked={Boolean(preferences[`email_${key}` as keyof Preferences])} /></div>
                <div className="grid place-items-center"><CompactToggle name={`in_app_${key}`} label={`${label} in-app notifications`} defaultChecked={Boolean(preferences[`in_app_${key}` as keyof Preferences])} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Toggle
              name="discreet_notifications"
              label="Discreet notifications"
              description="Hide sensitive booking details in notifications and emails."
              defaultChecked={preferences.discreet_notifications}
            />
          </div>
        </section>

        <section className="premium-panel p-6 sm:p-8">
          <h2 className="font-display text-3xl text-sinner-ivory">Privacy</h2>
          <div className="mt-6 grid gap-4">
            <Toggle
              name="use_display_name"
              label="Use my display name instead of my legal name when possible."
              description="Your private account name stays protected unless a verified operational flow requires it."
              defaultChecked={preferences.use_display_name}
            />
            <div className="flex gap-3 rounded-xl border hairline bg-black/20 p-4 text-sm leading-6 text-sinner-mist">
              <EyeOff size={18} className="mt-0.5 shrink-0 text-sinner-goldSoft" />
              <p>Your email, legal name and identity information are private account details.</p>
            </div>
          </div>
        </section>

        <section className="premium-panel p-6 sm:p-8">
          <h2 className="font-display text-3xl text-sinner-ivory">Account & Privacy</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border hairline bg-black/20 p-5">
              <Download size={19} className="text-sinner-goldSoft" />
              <h3 className="mt-4 font-semibold text-sinner-ivory">Download data</h3>
              <p className="mt-2 text-sm leading-6 text-sinner-mist">Data export will be available here.</p>
              <button type="button" disabled className="mt-4 min-h-10 cursor-not-allowed rounded-lg border hairline px-4 text-sm text-sinner-mist/60">Request my data</button>
            </div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.03] p-5">
              <Trash2 size={19} className="text-rose-200" />
              <h3 className="mt-4 font-semibold text-sinner-ivory">Delete account</h3>
              <p className="mt-2 text-sm leading-6 text-sinner-mist">Review important account closure details before continuing.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setDeleteOpen(true)} className="min-h-10 rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-sinner-ivory">Deactivate account</button>
                <button type="button" onClick={() => setDeleteOpen(true)} className="min-h-10 rounded-lg border border-rose-400/25 px-4 text-sm text-rose-100 transition hover:bg-rose-400/10">Delete account</button>
              </div>
            </div>
          </div>
        </section>

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border hairline bg-sinner-black/95 p-4 shadow-card backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck size={18} className={dirty ? "text-sinner-goldSoft" : "text-sinner-mist/60"} />
            <span className={dirty ? "font-semibold text-sinner-goldSoft" : "text-sinner-mist"}>{dirty ? "Unsaved changes" : "Settings are up to date"}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={discardChanges} disabled={!dirty} className="min-h-11 rounded-lg border hairline px-4 text-sm text-sinner-mist transition hover:text-sinner-ivory disabled:cursor-not-allowed disabled:opacity-45">Discard</button>
            <SaveButton dirty={dirty} />
          </div>
        </div>
      </form>
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  );
}
