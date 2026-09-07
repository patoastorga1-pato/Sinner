import type { Metadata } from "next";
import { AgeGate } from "@/components/AgeGate";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SINNER | Private spaces. After dark.",
  description: "Discover private spaces, experiences and lifestyle events created for adults.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="font-sans">
        <ToastProvider>
          <AgeGate />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
