"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import Container from "./Container";

const Navbar = ({ donationFormLink }: { donationFormLink: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close);

    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <header className="sticky top-[0px] z-50">
      <div className="relative">
        <nav>
          <Container className="flex justify-between py-2 max-w-full gap-1 bg-blue-60 backdrop-blur-xl">
            <Link href="/" className="flex gap-2 items-center">
              <div className="w-5">
                <Image
                  className="w-full h-auto"
                  alt="Selfless Sewa NGO Logomark"
                  id="logo"
                  src={"/selfless-sewa-logo.svg"}
                  width={12}
                  height={12}
                />
              </div>
              <p id="word-mark" className="font-display font-medium text-title-md">
                Selfless Sewa NGO
              </p>
            </Link>
            <ul className="flex text-body-lg tracking-wider items-stretch [&_a]:flex [&_a]:items-center gap-4 max-md:gap-2">
              <li className="max-md:hidden flex">
                <Link href="/projects">Projects</Link>
              </li>
              <li className="max-md:hidden flex">
                <Link href="/volunteer">Volunteer</Link>
              </li>
              <li className="max-md:hidden flex">
                <Link href="/team">Team</Link>
              </li>
              <li className="flex">
                <Link
                  href={donationFormLink}
                  target="_blank"
                  className="flex p-1 rounded-[0.8rem] bg-green-50 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 self-center backdrop-blur-2xl"
                >
                  <div className="px-2 py-1 rounded-[0.4rem] bg-green/50 flex gap-1 items-center">
                    <MaterialSymbol icon="volunteer_activism" weight={200} size={20} />
                    <span className="font-medium">Donate</span>
                  </div>
                </Link>
              </li>
              <li className="md:hidden flex">
                <button
                  className="flex items-center self-stretch"
                  onClick={() => {
                    setIsOpen(state => !state);
                  }}
                >
                  <MaterialSymbol icon={isOpen ? "close" : "menu"} size={24} weight={300} />
                </button>
              </li>
            </ul>
          </Container>
        </nav>
        <nav
          className={twMerge(
            "absolute w-full left-[0px] tracking-wider bg-blue-60 border-t border-blue-60 backdrop-blur-xl",
            isOpen ? "visible" : "hidden"
          )}
        >
          <Container className="py-2 max-w-full">
            <ul className="[&_a]:py-1 [&_a]:block duration-500 hover:[&_li]:underline underline-offset-2 flex flex-col">
              <li>
                <Link href="/projects" onClick={() => setIsOpen(false)}>
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/volunteer" onClick={() => setIsOpen(false)}>
                  Volunteer
                </Link>
              </li>
              <li>
                <Link href="/team" onClick={() => setIsOpen(false)}>
                  Team
                </Link>
              </li>
            </ul>
          </Container>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
