"use client";

import Link from "next/link";
import { track } from "@/analytics";

// A Donate CTA that records a GA4 `donate_cta_click` with where it was clicked
// (nav / hero / campaign …) so we can see which buttons drive donations.
export default function DonateLink({
  location,
  className,
  children,
  href = "/donate",
}: {
  location: string;
  className?: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track("donate_cta_click", { location })}
    >
      {children}
    </Link>
  );
}
