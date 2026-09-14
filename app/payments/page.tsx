import { CreditCard, FileText, ReceiptText } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireUser } from "@/lib/auth/server";
import { getCurrentUserPayments } from "@/lib/data-access/account";
import { formatMoney } from "@/lib/marketplace/pricing";

export default async function PaymentsPage() {
  await requireUser("/payments");
  const payments = await getCurrentUserPayments();

  return (
    <AccountShell title="Payments" copy="Payment methods, transaction history and billing information.">
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="premium-panel p-6">
            <CreditCard size={20} className="text-sinner-goldSoft" />
            <h2 className="mt-4 font-display text-3xl text-sinner-ivory">Payment methods</h2>
            <p className="mt-3 text-sm leading-6 text-sinner-mist">Prepared for PandaBlue approval and provider tokenization. No card collection is active yet.</p>
          </section>
          <section className="premium-panel p-6">
            <ReceiptText size={20} className="text-sinner-goldSoft" />
            <h2 className="mt-4 font-display text-3xl text-sinner-ivory">Transaction history</h2>
            <p className="mt-3 text-sm leading-6 text-sinner-mist">{payments.length ? `${payments.length} payment ${payments.length === 1 ? "record" : "records"} visible.` : "No payment records yet."}</p>
          </section>
          <section className="premium-panel p-6">
            <FileText size={20} className="text-sinner-goldSoft" />
            <h2 className="mt-4 font-display text-3xl text-sinner-ivory">Billing information</h2>
            <p className="mt-3 text-sm leading-6 text-sinner-mist">Billing profile fields are prepared for a future payment integration.</p>
          </section>
        </div>

        {payments.length ? (
          <section className="premium-panel overflow-hidden">
            <div className="border-b hairline p-5 sm:p-6">
              <h2 className="font-display text-3xl text-sinner-ivory">Payment records</h2>
              <p className="mt-2 text-sm text-sinner-mist">These rows come from Supabase payment ledgers.</p>
            </div>
            <div className="divide-y hairline">
              {payments.map((payment) => (
                <article key={payment.id} className="grid gap-4 p-5 text-sm sm:grid-cols-[1fr_auto] sm:p-6">
                  <div>
                    <p className="font-semibold text-sinner-ivory">{payment.provider}</p>
                    <p className="mt-1 text-sinner-mist">{payment.provider_reference ?? "No provider reference yet"}</p>
                    <p className="mt-2 text-xs text-sinner-mist/60">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-semibold text-sinner-ivory">{formatMoney(Number(payment.gross_amount), payment.currency)} {payment.currency}</p>
                    <p className="mt-1 text-xs uppercase text-sinner-goldSoft">{payment.status}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState icon={CreditCard} title="No payment records yet." copy="PandaBlue is not connected yet. Payment methods and transactions will appear here after provider integration." />
        )}
      </div>
    </AccountShell>
  );
}
