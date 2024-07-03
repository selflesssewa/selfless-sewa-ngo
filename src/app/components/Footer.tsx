import {
  SiGithub,
  SiInstagram,
  SiWhatsapp,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Container from "./Container";
import CopyButton from "./CopyButton";
import { TLayoutContent } from "@/types";

const Footer = ({ data }: { data: TLayoutContent }) => {
  return (
    <footer className="bg-blue-60 backdrop-blur-sm selection:bg-light-text-selection">
      <Container className="max-w-full py-5">
        <div className="flex justify-between gap-8 gap-y-5 max-lg:flex-col lg:items-start">
          <div className="flex basis-1/4 flex-col gap-4 self-stretch">
            <Link href="/" className="flex w-fit flex-col items-start gap-2">
              <div className="w-13">
                <Image
                  className="h-auto w-full"
                  alt="Selfless Sewa NGO logo-mark"
                  id="logo"
                  src={"/selfless-sewa-logo.svg"}
                  width={20}
                  height={20}
                />
              </div>
              <p
                id="word-mark"
                className="font-display text-nowrap text-title-md font-semibold"
              >
                Selfless Sewa NGO
              </p>
            </Link>
            <div className="mt-auto select-text text-body-md font-light tracking-wider opacity-70 duration-150 hover:opacity-100">
              <p>NITI Aayog Unique ID: UP/2024/0406482</p>
              <p>80G Certified: ABITS8872MF20241</p>
            </div>
          </div>
          <div className="flex grow flex-col gap-6">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(25ch,1fr))] gap-5 gap-y-4 md:gap-y-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:items-start [&_ul]:gap-2 max-md:[&_ul]:gap-1">
              <div>
                <p className="font-display mb-2 text-title-md font-light">
                  Contact
                </p>
                <ul className="font-extralight tracking-wider">
                  <li className="flex items-center gap-2">
                    {
                      //@ts-ignore
                      <SiWhatsapp size={18} />
                    }
                    <span className="select-text">{data.contactNo}</span>
                    <CopyButton value={data.contactNo} />
                  </li>
                  <li className="flex gap-1">
                    <Link
                      className="flex items-center gap-2"
                      href={`mailto:${data.contactEmailId}`}
                    >
                      <MaterialSymbol
                        icon="alternate_email"
                        size={22}
                        className="-mx-0"
                        weight={300}
                      />
                      <span className="select-text selection:bg-light-text-selection">
                        {data.contactEmailId}
                      </span>
                    </Link>
                    <CopyButton value={data.contactEmailId} />
                  </li>
                  <li className="flex items-center gap-2">
                    {
                      //@ts-ignore
                      <SiInstagram size={18} />
                    }
                    <Link href={data.socials[0].url} target="_blank">
                      {data.socials[0].handle}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-display mb-2 text-title-md font-light">
                  Volunteer
                </p>
                <ul className="font-extralight tracking-wider">
                  <li>
                    <Link
                      href={data.volunteerFormLink}
                      target="_blank"
                      className="flex items-center gap-1"
                    >
                      Become a सेवक
                      <MaterialSymbol
                        icon="arrow_outward"
                        size={16}
                        weight={300}
                      />
                    </Link>
                  </li>
                  <li>
                    <Link href="/volunteer#departments">Departments</Link>
                  </li>
                  <li>
                    <Link href="/volunteer#rules">Rules</Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-display mb-2 text-title-md font-light">
                  About
                </p>
                <ul className="font-extralight tracking-wider">
                  <li>
                    <Link href="/team">Team</Link>
                  </li>
                  <li>
                    <Link href="/projects">Projects</Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-display mb-2 text-title-md font-light">
                  Collab
                </p>
                <ul className="font-extralight tracking-wider">
                  <li className="flex gap-1">
                    <Link href={`mailto:${data.collabEmailId}`}>
                      {data.collabEmailId}
                    </Link>
                    <CopyButton value={data.collabEmailId} />
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-body-md tracking-wider opacity-80">
              <div>
                <span>
                  <MaterialSymbol
                    icon="copyright"
                    size={16}
                    weight={200}
                    className="translate-y-1"
                  />
                  &nbsp;2024&nbsp;&#8212;&nbsp;Selfless&nbsp;Sewa&nbsp;NGO.&nbsp;All&nbsp;rights&nbsp;reserved.{" "}
                </span>
                <a
                  className="-my-1 py-1 hover:underline"
                  target="_blank"
                  href="https://drive.google.com/file/d/1_s8KKDT1bGRpxHjE_hCQk8qhhh6n8cS8/view"
                >
                  Terms&nbsp;&&nbsp;Conditions
                </a>
                &nbsp;•&nbsp;
                <a
                  className="-my-1 py-1 hover:underline"
                  target="_blank"
                  href="https://drive.google.com/file/d/1JXkvjBlCJ0163Gv7R_GkeZxQT5XlBFkG/view"
                >
                  Privacy&nbsp;Policy
                </a>
              </div>
              <a
                target="_blank"
                href="https://github.com/sahilmulla"
                className="-m-1 -mx-2 flex items-baseline gap-2 text-nowrap rounded-lg p-1 px-2 duration-150 hover:bg-white/10"
                title="Check out my GitHub profile"
              >
                {
                  //@ts-ignore
                  <SiGithub size={12} className="translate-y-0" title="" />
                }
                Made by Sahil
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
