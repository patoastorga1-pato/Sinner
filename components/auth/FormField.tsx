export function FormField({ label, name, type = "text", autoComplete, required = true, defaultValue, max }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean; defaultValue?: string | null; max?: string }) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue ?? ""}
        max={max}
        className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
      />
    </label>
  );
}

