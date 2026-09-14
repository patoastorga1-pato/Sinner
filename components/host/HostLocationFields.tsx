"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { LocationSuggestion } from "@/lib/locations/mexico";

type HostLocationValues = {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  municipality: string;
  city: string;
  locality: string;
  postalCode: string;
  approximateLocation: string;
  exactAddress: string;
};

type HostLocationFieldsProps = {
  defaults?: Partial<HostLocationValues>;
};

function clean(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function publicLocation(values: Pick<HostLocationValues, "locality" | "city" | "state">) {
  return [values.locality, values.city, values.state].map(clean).filter(Boolean).join(", ");
}

function initialValues(defaults?: Partial<HostLocationValues>): HostLocationValues {
  return {
    country: clean(defaults?.country) || "Mexico",
    countryCode: clean(defaults?.countryCode) || "MX",
    state: clean(defaults?.state),
    stateCode: clean(defaults?.stateCode),
    municipality: clean(defaults?.municipality),
    city: clean(defaults?.city),
    locality: clean(defaults?.locality),
    postalCode: clean(defaults?.postalCode),
    approximateLocation: clean(defaults?.approximateLocation),
    exactAddress: clean(defaults?.exactAddress),
  };
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  name: keyof HostLocationValues;
  value: string;
  onChange: (name: keyof HostLocationValues, value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-sinner-ivory">
      <span className="font-medium">{label}</span>
      <input
        name={name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        required
        className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25 read-only:text-sinner-mist"
      />
    </label>
  );
}

export function HostLocationFields({ defaults }: HostLocationFieldsProps) {
  const listId = useId();
  const [values, setValues] = useState(() => initialValues(defaults));
  const [query, setQuery] = useState(() => publicLocation(initialValues(defaults)));
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedApproximateLocation = useMemo(() => {
    return values.approximateLocation || publicLocation(values);
  }, [values]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const nextSuggestions = (await response.json()) as LocationSuggestion[];
        setSuggestions(nextSuggestions);
        setActiveIndex(-1);
        setOpen(nextSuggestions.length > 0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function updateValue(name: keyof HostLocationValues, value: string) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (name === "locality" || name === "city" || name === "state") {
        next.approximateLocation = publicLocation(next);
      }
      return next;
    });
  }

  function selectSuggestion(suggestion: LocationSuggestion) {
    const selectedCity = suggestion.state === "Ciudad de México" ? "Ciudad de México" : suggestion.city;
    const selectedMunicipality = suggestion.municipality ?? suggestion.city;
    const next = {
      ...values,
      country: "Mexico",
      countryCode: "MX",
      state: suggestion.state,
      stateCode: suggestion.stateCode,
      municipality: selectedMunicipality,
      city: selectedCity,
      locality: suggestion.locality ?? values.locality,
    };
    next.approximateLocation = publicLocation(next);
    setValues(next);
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <section className="grid gap-5">
      <label className="grid gap-2 text-sm text-sinner-ivory">
        <span className="font-medium">Search city, municipality or state</span>
        <span className="relative">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              const nextValue = event.target.value;
              setQuery(nextValue);
              if (nextValue.trim().length < 2) {
                setSuggestions([]);
                setOpen(false);
              }
            }}
            onFocus={() => setOpen(suggestions.length > 0)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && suggestions.length) {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((index) => (index + 1) % suggestions.length);
              } else if (event.key === "ArrowUp" && suggestions.length) {
                event.preventDefault();
                setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
              } else if (event.key === "Enter" && open && activeIndex >= 0) {
                event.preventDefault();
                selectSuggestion(suggestions[activeIndex]);
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Guadalajara, Cancún, Monterrey..."
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
            className="h-12 w-full rounded-lg border hairline bg-black/35 px-4 pr-10 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
          />
          {loading ? <LoaderCircle aria-hidden="true" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sinner-mist" /> : null}
          {open ? (
            <ul id={listId} role="listbox" className="absolute left-0 top-14 z-50 max-h-72 w-full overflow-y-auto rounded-lg border border-white/10 bg-[#121015] p-1 shadow-2xl">
              {suggestions.map((suggestion, index) => (
                <li key={`${suggestion.label}-${suggestion.stateCode}`}>
                  <button
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full rounded-md px-3 py-2.5 text-left text-sm transition ${activeIndex === index ? "bg-white/[0.08] text-white" : "text-sinner-mist hover:bg-white/[0.06] hover:text-white"}`}
                  >
                    {suggestion.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" name="country" value={values.country} onChange={updateValue} readOnly />
        <Field label="Country code" name="countryCode" value={values.countryCode} onChange={updateValue} readOnly />
        <Field label="State" name="state" value={values.state} onChange={updateValue} placeholder="Jalisco" />
        <Field label="State code" name="stateCode" value={values.stateCode} onChange={updateValue} placeholder="JAL" />
        <Field label="Municipality" name="municipality" value={values.municipality} onChange={updateValue} placeholder="Guadalajara" />
        <Field label="City" name="city" value={values.city} onChange={updateValue} placeholder="Guadalajara" />
        <Field label="Locality / neighborhood" name="locality" value={values.locality} onChange={updateValue} placeholder="Providencia" />
        <Field label="Postal code" name="postalCode" value={values.postalCode} onChange={updateValue} placeholder="44630" />
      </div>

      <input type="hidden" name="approximate_location" value={resolvedApproximateLocation} />
      <label className="grid gap-2 text-sm text-sinner-ivory">
        <span className="font-medium">Public location</span>
        <input
          value={resolvedApproximateLocation}
          onChange={(event) => updateValue("approximateLocation", event.target.value)}
          className="h-12 rounded-lg border hairline bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/45 focus:ring-2 focus:ring-sinner-purple/25"
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-sinner-ivory">
        <span className="font-medium">Exact address</span>
        <input
          name="exact_address"
          value={values.exactAddress}
          onChange={(event) => updateValue("exactAddress", event.target.value)}
          placeholder="Street, number, interior, references"
          required
          className="h-12 rounded-lg border border-sinner-gold/25 bg-black/35 px-4 text-white outline-none transition placeholder:text-sinner-mist/45 focus:border-sinner-gold/55 focus:ring-2 focus:ring-sinner-purple/25"
        />
      </label>
    </section>
  );
}
