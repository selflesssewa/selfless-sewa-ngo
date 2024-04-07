import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Container from "./Container";

const Navbar = () => {
  return (
    <header className="bg-blue-60 backdrop-blur-xl sticky top-[0px] z-10">
      <Container className="max-w-full">
        <nav className="flex justify-between py-2">
          <Link href="/" className="flex gap-2 items-center">
            <div className="w-5">
              <img
                className="w-full h-auto"
                alt="Selfless Sewa NGO Logomark"
                id="logo"
                src={"selfless-sewa-logo.svg"}
              />
            </div>
            <p id="word-mark" className="font-display font-semibold text-title-md py-1 text-nowrap">
              Selfless Sewa
            </p>
          </Link>
          <ul className="flex  max-md:hidden text-body-lg tracking-wider items-stretch [&_li]:flex [&_a]:flex [&_a]:items-center gap-4">
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/team">Volunteer</Link>
            </li>
            <li>
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
          </ul>
        </nav>
      </Container>
    </header>
  );
};

export default Navbar;
