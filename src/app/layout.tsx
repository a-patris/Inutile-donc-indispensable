import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inutile donc indispensable",
  description: "Une blague et une info inutile chaque jour",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
