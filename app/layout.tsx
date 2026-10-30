import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// opsz axis: Inter switches to its Display cut at large sizes (DESIGN.md's open substitute for Neue Haas Display).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });

export const metadata: Metadata = {
  title: "Logcase",
  description: "Catálogo, inventario y ventas para pequeños negocios — Stonemills",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
