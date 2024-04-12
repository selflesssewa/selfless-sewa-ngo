import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Container from "./Container";
import CopyButton from "./CopyButton";

const Footer = ({ data }: { data: TLayoutContent }) => {
  return (
    <footer className="bg-blue-60 backdrop-blur-sm">
      <Container className="py-5 max-w-full">
        <div className="flex max-lg:flex-col lg:items-start gap-8 justify-between gap-y-5">
          <div className="basis-1/4">
            <Link href="/" className="flex flex-col gap-2 items-start">
              <div className="w-13">
                <Image
                  className="w-full h-auto"
                  alt="Selfless Sewa NGO Logomark"
                  id="logo"
                  src={"/selfless-sewa-logo.svg"}
                  width={20}
                  height={20}
                />
              </div>
              <p id="word-mark" className="font-display font-semibold text-title-md text-nowrap">
                Selfless Sewa NGO
              </p>
            </Link>
          </div>
          <div className="grow">
            <div
              className="grid grid-cols-[repeat(auto-fill,minmax(25ch,1fr))] gap-5 gap-y-4 [&_ul]:flex
             [&_ul]:gap-2 max-md:[&_ul]:gap-1 [&_ul]:flex-col [&_ul]:items-start"
            >
              <div>
                <p className="text-title-md font-medium mb-2">Contact</p>
                <ul className="font-extralight tracking-wider">
                  <li className="flex items-center gap-2">
                    {
                      //@ts-ignore
                      <SiWhatsapp size={18} />
                    }
                    <span className="select-text selection:bg-light-text-selection">{data.contactNo}</span>
                    <CopyButton value={data.contactNo} />
                  </li>
                  <li className="flex gap-1">
                    <Link className="flex items-center gap-2" href={`mailto:${data.contactEmailId}`}>
                      <MaterialSymbol icon="alternate_email" size={22} className="-mx-0" weight={300} />
                      <span className="select-text selection:bg-light-text-selection">{data.contactEmailId}</span>
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
                <p className="text-title-md font-medium mb-2">Volunteer</p>
                <ul className="font-extralight tracking-wider">
                  <li>
                    <Link href={data.volunteerFormLink} target="_blank" className="flex items-center gap-1">
                      Become a Sewak
                      <MaterialSymbol icon="arrow_outward" size={16} weight={300} />
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
                <p className="text-title-md font-medium mb-2">About</p>
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
                <p className="text-title-md font-medium mb-2">Collab</p>
                <ul className="font-extralight tracking-wider">
                  <li className="flex gap-1">
                    <Link href={`mailto:${data.collabEmailId}`}>{data.collabEmailId}</Link>
                    <CopyButton value={data.collabEmailId} />
                  </li>
                </ul>
              </div>
            </div>
            <p className="text-body-md mt-6 opacity-90 tracking-wider">
              <MaterialSymbol icon="copyright" size={16} weight={200} className="translate-y-1" />
              &nbsp;2024&nbsp;&#8212;&nbsp;Selfless&nbsp;Sewa&nbsp;NGO. All&nbsp;rights&nbsp;reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
