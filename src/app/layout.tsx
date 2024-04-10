import type { Metadata } from "next";
import { DM_Sans, Fraunces, Karma } from "next/font/google";
import "react-material-symbols/rounded";
import { twMerge } from "tailwind-merge";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-body",
});
const displayFont = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["italic", "normal"],
  axes: ["opsz", "WONK", "SOFT"],
  variable: "--font-display",
});
const hindiFont = Karma({
  subsets: ["devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hindi",
});

export const metadata: Metadata = {
  title: "Selfless Sewa NGO",
  description: "Service Above Self",
  keywords: ["Non-governmental organization", "Selfless Sewa"],
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={twMerge(bodyFont.variable, displayFont.variable, hindiFont.variable, "text-white font-body")}>
        <div className="from-blue/95 to-green/75 bg-gradient-to-bl bg-no-repeat left-[0px] top-[0px] w-full h-full fixed -z-10" />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
