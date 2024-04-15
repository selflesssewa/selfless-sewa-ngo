import { getLayoutContent } from "@/dao";
import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, Karma } from "next/font/google";
import "react-material-symbols/rounded";
import { twMerge } from "tailwind-merge";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./globals.css";

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
      siteName: "Selfless Sewa NGO",
      title: "Selfless Sewa",
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
      <body className={twMerge(bodyFont.variable, displayFont.variable, hindiFont.variable, "text-white font-body")}>
        <div className="from-blue/95 to-green/75 bg-gradient-to-bl bg-no-repeat left-[0px] top-[0px] w-full h-lvh fixed -z-10" />
        <Navbar donationFormLink={data.donationFormLink} />
        {children}
        <Footer data={data} />
      </body>
    </html>
  );
}
