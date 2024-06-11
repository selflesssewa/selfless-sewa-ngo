import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import CallToActionCard from "../components/CallToActionCard";
import Container from "../components/Container";
import { getTeamPageContent, teamBeliefs } from "@/dao";
import GlowCard from "../components/GlowCard";

const Team = async () => {
  const data = await getTeamPageContent();

  return (
    <main className="min-h-screen">
      <section>
        <Container className="my-12 flex flex-col items-center md:my-17">
          <MaterialSymbol
            icon="flare"
            weight={200}
            size={40}
            className="mb-2"
          />
          <h2 className="mb-4 text-center tracking-wider">
            Our Guiding Principle
          </h2>
          <h3 className="font-display mb-7 text-center text-headline-lg font-light italic tracking-tight md:mb-10 md:text-display-sm">
            Lead By Example
          </h3>
          <div className="grid auto-cols-fr auto-rows-auto gap-3 md:grid-cols-2 md:gap-6">
            {teamBeliefs.map((belief, idx) => (
              <GlowCard key={idx} className="md:max-w-[35ch]">
                <p className="text-pretty drop-shadow-md">{belief}</p>
              </GlowCard>
            ))}
          </div>
        </Container>
      </section>
      <section>
        <Container className="flex flex-col">
          <div className="mb-12 mt-6 self-center rounded-[24px] bg-white-70 p-5 text-black backdrop-blur-lg md:px-7 md:py-6">
            <h2 className="mb-3 text-headline-sm tracking-normal">Our सेवकs</h2>
            <p className="max-w-[45ch] text-pretty">
              At Selfless Sewa NGO, every volunteer (सेवक) embodies the spirit
              of “Sewa”. Whether our founder, core team, or dedicated
              volunteers, we all serve selflessly. Our founder leads as the
              Founder सेवक, and our core team are Core सेवक, setting the
              standard for service. Together, we live our values through every
              act of Sewa.
            </p>
          </div>
          <h1 className="my-7 text-center tracking-wider">Our Team</h1>
          <GlowCard className="my-4 mb-14 flex grow rounded-[12px] p-3 backdrop-blur max-sm:flex-col max-sm:gap-y-4">
            <div className="relative aspect-square overflow-clip rounded-[4px] sm:basis-2/5">
              <Image
                fill
                sizes="500x500"
                className="h-full w-full -scale-x-100 object-cover"
                src={data.founder.imgUrl}
                alt={data.founder.name}
              />
            </div>
            <div className="drop-shadow-md max-sm:pb-2 sm:basis-3/5 sm:p-3 sm:px-4">
              <p
                className="text-title-lg font-medium"
                title={data.founder.name}
              >
                {data.founder.name}
              </p>
              <p
                className="overflow-hidden text-ellipsis whitespace-nowrap font-medium tracking-wider"
                title={data.founder.role}
              >
                {data.founder.role}
              </p>
              <div className="mt-3 max-w-prose text-pretty">
                {data.founder.bio}
              </div>
            </div>
          </GlowCard>
          <h2 className="text-center tracking-wider">Core Team</h2>
          <ul className="my-8 grid grid-cols-[repeat(auto-fill,minmax(24rem,1fr))] gap-2 max-md:grid-cols-3 max-sm:grid-cols-2 sm:gap-3 sm:gap-x-2 md:gap-4 md:gap-x-2">
            {data.team.map((sewak, idx) => (
              <li key={idx}>
                <GlowCard className="flex flex-col gap-3 p-2">
                  <div className="relative aspect-square grow overflow-clip rounded-[4px]">
                    <Image
                      fill
                      sizes="300x300"
                      className="object-cover"
                      src={sewak.imgUrl}
                      alt={sewak.name}
                    />
                  </div>
                  <div className="drop-shadow-md">
                    <p
                      className="overflow-hidden text-ellipsis whitespace-nowrap font-medium"
                      title={sewak.name}
                    >
                      {sewak.name}
                    </p>
                    <p
                      className="overflow-hidden text-ellipsis whitespace-nowrap text-body-lg tracking-wider"
                      title={sewak.role}
                    >
                      {sewak.role}
                    </p>
                  </div>
                </GlowCard>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section>
        <Container className="flex min-h-[80vh] items-center py-8">
          <CallToActionCard
            title="Join the team"
            body="Join our community of Selfless सेवकs of Selfless Sewa NGO & make an impact by serving those in need & spread kindness and compassion. Your dedication and willingness to serve will make a difference in the lives of others. Join us in our journey of Selfless Sewa! Register now and be the change you want to see in the world."
            imgSrc="/images/IMG_1582.jpeg"
            imgAltText=""
            footer={
              <div className="mt-8">
                <p className="mb-2 ms-1 text-body-lg font-medium text-black">
                  Ready to become a सेवक?
                </p>
                <div className="flex gap-3">
                  <Link
                    href={data.volunteerFormLink}
                    target="_blank"
                    className="flex rounded-[0.8rem] bg-blue-30 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
                  >
                    <div className="flex items-center gap-1 rounded-[0.4rem] bg-blue-60 px-3 py-2">
                      <span>Apply</span>
                      <MaterialSymbol icon="arrow_outward" />
                    </div>
                  </Link>
                  <Link
                    href="/volunteer#rules"
                    className="flex items-center text-black"
                  >
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
