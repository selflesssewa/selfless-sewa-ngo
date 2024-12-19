"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import Container from "./Container";

const Navbar = () => {
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
          <Container className="nav-mask flex max-w-full justify-between gap-3 py-2 after:backdrop-blur">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-5 rounded-full border border-white-70">
                <Image
                  className="h-auto w-full"
                  alt="Selfless Sewa NGO Logomark"
                  id="logo"
                  src={"/selfless-sewa-logo.svg"}
                  width={12}
                  height={12}
                />
              </div>
              <p
                id="word-mark"
                className="font-display text-title-md font-medium"
              >
                Selfless Sewa NGO
              </p>
            </Link>
            <ul className="flex items-stretch gap-0 text-body-lg tracking-wider underline-offset-4 max-md:gap-2 [&_a]:flex [&_a]:items-center">
              <li className="flex rounded-[0.8rem] duration-300 hover:bg-blue-30 max-md:hidden">
                <Link href="/projects" className="px-3 drop-shadow-md">
                  Projects
                </Link>
              </li>
              <li className="flex rounded-[0.8rem] duration-300 hover:bg-blue-30 max-md:hidden">
                <Link href="/campaigns" className="px-3 drop-shadow-md">
                  Campaigns
                </Link>
              </li>
              <li className="flex rounded-[0.8rem] duration-300 hover:bg-blue-30 max-md:hidden">
                <Link href="/volunteer" className="px-3 drop-shadow-md">
                  Volunteer
                </Link>
              </li>
              <li className="flex rounded-[0.8rem] duration-300 hover:bg-blue-30 max-md:hidden">
                <Link href="/team" className="px-3 drop-shadow-md">
                  Team
                </Link>
              </li>
              <li className="flex">
                <Link
                  href="/donate"
                  className="ms-3 flex self-center rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
                >
                  <div className="flex items-center gap-1 rounded-[0.4rem] bg-green-50 px-2 py-1">
                    <MaterialSymbol
                      icon="volunteer_activism"
                      weight={200}
                      size={20}
                    />
                    <span className="font-medium">Donate</span>
                  </div>
                </Link>
              </li>
              <li className="flex md:hidden">
                <button
                  className="flex items-center self-stretch"
                  onClick={() => {
                    setIsOpen((state) => !state);
                  }}
                >
                  <MaterialSymbol
                    icon={isOpen ? "close" : "menu"}
                    size={24}
                    weight={300}
                  />
                </button>
              </li>
            </ul>
          </Container>
        </nav>
        <nav
          className={twMerge(
            "absolute left-[0px] w-full border-b border-t border-blue-30 bg-blue-30 tracking-wider backdrop-blur-md",
            isOpen ? "visible" : "hidden",
          )}
        >
          <Container className="max-w-full py-2">
            <ul className="flex flex-col text-body-lg underline-offset-4 duration-500 [&_a]:block [&_a]:py-2 [&_li]:drop-shadow-md hover:[&_li]:underline">
              <li>
                <Link href="/projects" onClick={() => setIsOpen(false)}>
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/campaigns" onClick={() => setIsOpen(false)}>
                  Campaigns
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
