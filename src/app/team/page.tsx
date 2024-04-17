import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import CallToActionCard from "../components/CallToActionCard";
import Container from "../components/Container";
import { getTeamPageContent, teamBeliefs } from "@/dao";

const Team = async () => {
  const data = await getTeamPageContent();

  return (
    <main className="min-h-screen">
      <section>
        <Container className="flex items-center flex-col my-12  md:my-17">
          <MaterialSymbol icon="flare" weight={200} size={40} className="mb-2" />
          <h2 className="mb-4 tracking-wider text-center">Our Guiding Principle</h2>
          <h3 className="font-display text-headline-lg md:text-display-sm tracking-tight italic mb-7 text-center">
            Lead By Example
          </h3>

          <div className="grid md:grid-cols-2 gap-1 bg-blue-60 p-1 backdrop-blur-xl rounded-[8px] auto-rows-fr auto-cols-fr">
            {teamBeliefs.map((belief, idx) => (
              <div className="bg-white-70 text-balance text-black rounded-[4px] px-4 py-3 md:max-w-[40ch]" key={idx}>
                <p>{belief}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section>
        <Container className="flex flex-col">
          <div className="bg-white-70 self-center text-black p-5 md:px-7 mb-12 mt-6 md:py-6  backdrop-blur-lg rounded-[24px]">
            <h2 className="text-headline-sm mb-3 tracking-normal">Our Sewaks</h2>
            <p className="max-w-[45ch] text-pretty">
              At Selfless Sewa NGO, every volunteer (sewak) embodies the spirit of “Sewa”. Whether our founder, core
              team, or dedicated volunteers, we all serve selflessly. Our founder leads as the Founder Sewak, and our
              core team are Core Sewak, setting the standard for service. Together, we live our values through every act
              of Sewa.
            </p>
          </div>
          <h1 className="tracking-wider text-center my-7">Our Team</h1>
          <div className="flex max-sm:flex-col p-2 my-4 mb-14 gap-2 bg-blue-30 backdrop-blur-lg rounded-[12px] grow">
            <div className="relative sm:basis-2/5 aspect-square rounded-[4px] overflow-clip">
              <Image
                fill
                sizes="500x500"
                className="object-cover w-full h-full -scale-x-100"
                src={data.founder.imgUrl}
                alt={data.founder.name}
              />
            </div>
            <div className=" bg-white-70 sm:basis-3/5 text-black backdrop-blur-lg rounded-[4px] p-3 max-sm:pb-4 px-4">
              <p className="text-title-lg font-medium" title={data.founder.name}>
                {data.founder.name}
              </p>
              <p className="text-ellipsis font-medium whitespace-nowrap overflow-hidden" title={data.founder.role}>
                {data.founder.role}
              </p>
              <div className="mt-3 text-balance max-w-prose">{data.founder.bio}</div>
            </div>
          </div>
          <h2 className="tracking-wider text-center">Core Team</h2>
          <ul className="grid max-sm:grid-cols-2 max-md:grid-cols-3 my-8 grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-2 sm:gap-3 sm:gap-x-2 md:gap-4 md:gap-x-2">
            {data.team.map((sewak, idx) => (
              <li className="flex flex-col p-1 gap-1 bg-blue-30 backdrop-blur-lg rounded-[8px]" key={idx}>
                <div className="relative grow aspect-square rounded-[4px] overflow-clip">
                  <Image
                    fill
                    sizes="300x300"
                    className="object-cover w-full h-full"
                    src={sewak.imgUrl}
                    alt={sewak.name}
                  />
                </div>
                <div className="bg-white-70 text-black backdrop-blur-lg rounded-[4px] ps-[1.2rem] p-2 font-medium">
                  <p className="text-ellipsis whitespace-nowrap overflow-hidden" title={sewak.name}>
                    {sewak.name}
                  </p>
                  <p className="text-body-lg text-ellipsis whitespace-nowrap overflow-hidden" title={sewak.role}>
                    {sewak.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section>
        <Container className="py-8 flex items-center min-h-[80vh]">
          <CallToActionCard
            title="Join the team"
            body="Join our community of Selfless सेवकs of Selfless Sewa NGO & make an impact by serving those in need & spread kindness and compassion. Your dedication and willingness to serve will make a difference in the lives of others. Join us in our journey of Selfless Sewa! Register now and be the change you want to see in the world."
            imgSrc="/images/IMG_1582.jpeg"
            imgAltText=""
            footer={
              <div className="mt-8">
                <p className="text-black text-body-lg font-medium mb-1">Ready to become a Sewak?</p>
                <div className="flex gap-3">
                  <Link
                    href={data.volunteerFormLink}
                    target="_blank"
                    className="flex p-1 rounded-[0.8rem] bg-blue-30 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl"
                  >
                    <div className="px-3 py-2 rounded-[0.4rem] bg-blue-60 gap-1 flex items-center">
                      <span>Apply</span>
                      <MaterialSymbol icon="arrow_outward" />
                    </div>
                  </Link>
                  <Link href="/volunteer#rules" className="flex items-center text-black">
                    See Rules
                  </Link>
                </div>
              </div>
            }
          />
        </Container>
      </section>
    </main>
  );
};

export default Team;
