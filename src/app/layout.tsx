import { DM_Sans, Fraunces } from "next/font/google";
import "react-material-symbols/rounded";
import "./globals.css";
import { twMerge } from "tailwind-merge";
import type { Metadata } from "next";
import Navbar from "./components/Navbar";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});
const displayFont = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["italic", "normal"],
  axes: ["opsz", "WONK", "SOFT"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Selfless Sewa NGO",
  description: "Service Above Self",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={twMerge(bodyFont.variable, displayFont.variable, "text-white min-h-[400vh] font-body")}>
        <div className="from-blue/95 to-green/75 bg-gradient-to-bl bg-no-repeat min-h-svh fixed inset-[0px] -z-10" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
