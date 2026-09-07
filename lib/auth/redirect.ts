export function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function withMessage(path: string, kind: "error" | "success", message: string) {
  const url = new URL(path, "http://sinner.local");
  url.searchParams.set(kind, message);
  return `${url.pathname}${url.search}`;
}

