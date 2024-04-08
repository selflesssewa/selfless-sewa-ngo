"use client";

import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Container from "./Container";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    console.log(pathname);
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close);

    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <header className="bg-blue-60 backdrop-blur-xl sticky top-[0px] z-10">
      <Container className="max-w-full ">
        <nav className="flex justify-between py-2">
          <Link href="/" className="flex gap-2 items-center">
            <div className="w-5">
              <Image
                className="w-full h-auto"
                alt="Selfless Sewa NGO Logomark"
                id="logo"
                src={"/selfless-sewa-logo.svg"}
                width={5}
                height={5}
              />
            </div>
            <p id="word-mark" className="font-display font-semibold text-title-md text-nowrap">
              Selfless Sewa
            </p>
          </Link>
          <ul className="flex text-body-lg tracking-wider items-stretch [&_a]:flex [&_a]:items-center gap-4 max-md:gap-3">
            <li className="max-md:hidden flex">
              <Link href="/projects">Projects</Link>
            </li>
            <li className="max-md:hidden flex">
              <Link href="/volunteer">Volunteer</Link>
            </li>
            <li className="max-md:hidden flex">
              <Link href="/team">Team</Link>
            </li>
            <li>
              <Link
                href="#donate"
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
                  setIsOpen(s => !s);
                }}
              >
                <MaterialSymbol icon="menu" size={24} weight={300} />
              </button>
            </li>
          </ul>
        </nav>
        <nav
          className={twMerge(
            "fixed z-20 w-full left-[0px] font-medium tracking-wider bg-blue",
            isOpen ? "visible" : "hidden"
          )}
        >
          <Container className="py-2 max-w-full">
            <ul className="[&_a]:py-1 [&_a]:block duration-500 hover:[&_li]:underline  underline-offset-2 flex flex-col">
              <li>
                <Link href="/projects">Projects</Link>
              </li>
              <li>
                <Link href="/volunteer">Volunteer</Link>
              </li>
              <li>
                <Link href="/team">Team</Link>
              </li>
            </ul>
          </Container>
        </nav>
      </Container>
    </header>
  );
};

export default Navbar;
