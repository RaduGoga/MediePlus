import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppBoot } from "@/components/AppBoot";
import { Onboarding } from "@/components/Onboarding";

// Tipografie păstrată: Montserrat (analog „Monty Bold") pentru titluri, Inter corp.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "MediePlus+",
  description: "Co-pilotul de productivitate pentru elevii din România.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MediePlus+" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <AppBoot />
        <Onboarding />
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
