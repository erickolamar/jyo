import type { Metadata } from "next";
import "./design.css";

export const metadata: Metadata = {
  title: "ARCANUM — Les histoires ont leurs secrets",
  description: "Découvrez des œuvres narratives à lire, écouter et regarder. Entrez dans l’univers des Disparus du Dimanche, par Arnaud Banaken.",
  manifest: '/manifest.webmanifest',
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
