import { AlertCircle, CheckCircle2 } from "lucide-react";

export function StatusMessage({ error, success }: { error?: string; success?: string }) {
  const message = error ?? success;
  if (!message) return null;

  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <div className={`mb-5 flex gap-3 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-400/25 bg-red-500/10 text-red-100" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"}`} role="status">
      <Icon size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

