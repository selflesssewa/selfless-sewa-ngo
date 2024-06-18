import { getLayoutContent } from "@/dao";
import type { Metadata, Viewport } from "next";
import {
  Domine,
  Fraunces,
  Ibarra_Real_Nova,
  Instrument_Sans,
  Josefin_Sans,
  Josefin_Slab,
  Karma,
  Source_Serif_4,
  Volkhov,
  Vollkorn,
} from "next/font/google";
import "react-material-symbols/rounded";
import { twMerge } from "tailwind-merge";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["italic", "normal"],
  axes: ["opsz", "WONK", "SOFT"],
});

const hindiFont = Karma({
  variable: "--font-hindi",
  subsets: ["devanagari"],
  weight: ["500"],
});

export async function generateMetadata() {
  return {
    metadataBase: new URL("https://www.selflesssewango.com"),
    title: "Selfless Sewa NGO",
    description: "Service Above Self",
    keywords: ["Non-governmental organization", "Selfless Sewa"],
    icons: [
      {
        rel: "icon",
        url: "/favicon-16x16.png",
        sizes: "16x16",
      },
      {
        rel: "icon",
        url: "/favicon-32x32.png",
        sizes: "32x32",
      },
    ],
    category: "Non-governmental organization",
    openGraph: {
      title: "Selfless Sewa NGO",
      description: "Service Above Self",
      url: "https://selflesssewango.com",
      type: "website",
      images: ["/android-chrome-512x512.png"],
    },
    twitter: {
      title: "Selfless Sewa NGO",
      description: "Service Above Self",
      card: "summary",
      creator: "@SaMulla7",
      images: ["/android-chrome-512x512.png"],
    },
  } as Metadata;
}

export const viewport: Viewport = {
  themeColor: "#1D366F",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const data = await getLayoutContent();

  return (
    <html lang="en">
      <body
        className={twMerge(
          bodyFont.variable,
          displayFont.variable,
          hindiFont.variable,
          "font-body text-white",
        )}
      >
        <div className="pointer-events-none fixed left-[0px] top-[0px] -z-10 h-lvh w-full overflow-hidden bg-gradient-to-b from-blue/95 via-blue/85 via-30% to-green/70 bg-no-repeat">
          <div className="relative h-full w-full">
            <div className="absolute inset-[0px] bg-[repeating-radial-gradient(circle_at_center,theme(colors[blue]/7%),0.00015px,theme(colors[blue]/7%),0,theme(colors[white]/7%),0.0003px,theme(colors[white]/7%)_0)]" />
            <div className="blob-1 absolute z-10" />
            <div className="blob-2 absolute z-10" />
          </div>
        </div>
        <Navbar donationFormLink={data.donationFormLink} />
        {children}
        <Footer data={data} />
        <Analytics />
      </body>
    </html>
  );
}
