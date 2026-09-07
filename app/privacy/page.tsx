import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function PrivacyPage() {
  return <main><Header /><article className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><p className="text-xs font-semibold uppercase text-sinner-gold">Legal</p><h1 className="mt-3 font-display text-5xl text-sinner-ivory">Privacy Policy</h1><div className="mt-8 space-y-5 leading-7 text-sinner-mist"><p>Private account information, including date of birth and legal acceptance records, is restricted to the account owner and authorized platform processes.</p><p>Exact private-space addresses are not part of public listing queries. Access controls are enforced with server authorization and database Row Level Security.</p><p>This development copy must receive legal review before launch.</p></div></article><Footer /></main>;
}

