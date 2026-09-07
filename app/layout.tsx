import type { Metadata } from "next";
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
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
