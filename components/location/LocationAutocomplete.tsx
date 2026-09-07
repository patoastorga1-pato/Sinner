"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { LocationSuggestion } from "@/lib/locations/mexico";

export function LocationAutocomplete({ id, defaultValue = "" }: { id: string; defaultValue?: string }) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
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
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function selectSuggestion(suggestion: LocationSuggestion) {
    setValue(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        id={id}
        type="search"
        name="location"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value.trim().length < 2) {
            setSuggestions([]);
            setOpen(false);
          }
        }}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setOpen(false), 100)}
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
        placeholder="Ciudad, municipio o estado"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className="w-full min-w-0 bg-transparent pr-6 text-sm text-sinner-ivory outline-none placeholder:text-sinner-mist/70"
      />
      {loading ? <LoaderCircle aria-hidden="true" size={14} className="absolute right-0 top-1/2 -translate-y-1/2 animate-spin text-sinner-mist" /> : null}
      {open ? (
        <ul id={listId} role="listbox" className="absolute left-[-2.75rem] top-10 z-50 max-h-72 min-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-white/10 bg-[#121015] p-1 shadow-2xl">
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
    </div>
  );
}
