import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import CallToActionCard from "../components/CallToActionCard";
import Container from "../components/Container";
import { getCoreTeam } from "@/dao";

const teamBeliefs = [
  `At Selfless Sewa, our mantra of "Lead by Example" is our guiding light. It’s about walking the talk and setting the bar high ineverything we do. We don't just preach; we practice what we believe in—excellence, service, and dedication.`,
  `By leading with integrity and passion, we inspire others to follow suit and join us in our mission of service and empowerment. Our actions speak volumes, showing that making a difference is not just a slogan but a way of life.`,
];

// const sewaks = [
//   {
//     name: "Siddhi Sonthalia",
//     role: "Chief Of Coordination",
//     img: "Siddhi Sonthalia.jpg",
//   },
//   {
//     name: "Jaanvi Gupta",
//     role: "Human Resources & Management",
//     img: "Jaanvi Gupta.jpg",
//   },
//   {
//     name: "Mahak Goyal",
//     role: "Research & Planning",
//     img: "Mahak Goyal.jpg",
//   },
//   {
//     name: "Dhavi Manchanda",
//     role: "Social Media & Content",
//     img: "Dhavi Manchanda.jpg",
//   },
//   {
//     name: "Sadhika Singh",
//     role: "Public Research & Outreach",
//     img: "Sadhika Singh.webp",
//   },
//   {
//     name: "Anjali Baisla",
//     role: "Operations & Logistics",
//     img: "Anjali Baisla.jpg",
//   },
//   {
//     name: "Shivam Mundhra",
//     role: "Operations & Logistics",
//     img: "Shivam Mundhra.jpg",
//   },
//   {
//     name: "Srishti Bhatt",
//     role: "Operations & Logistics",
//     img: "Srishti Bhatt.jpg",
//   },
// ] as const;

const Team = async () => {
  const sewaks = await getCoreTeam();

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
          <h2 className="tracking-wider text-center mt-7">Our Founder</h2>
          <div className="flex max-sm:flex-col p-1 my-8 gap-1 bg-blue-30 backdrop-blur-lg rounded-[8px] grow">
            <div className="relative basis-2/5 aspect-square rounded-[4px] overflow-clip">
              <Image
                fill
                className="object-cover w-full h-full -scale-x-100"
                src={sewaks.founder.imgUrl}
                alt={sewaks.founder.name}
              />
            </div>
            <div className="grow bg-white-70 text-black backdrop-blur-lg rounded-[4px] p-3 px-4">
              <p className="text-title-lg font-medium" title={sewaks.founder.name}>
                {sewaks.founder.name}
              </p>
              <h2 className="text-ellipsis font-medium whitespace-nowrap overflow-hidden" title={sewaks.founder.role}>
                {sewaks.founder.role}
              </h2>
              <p className="mt-3">{sewaks.founder.bio}</p>
            </div>
          </div>
          <h2 className="tracking-wider text-center mt-7">Our Core Team</h2>
          <ul className="grid max-sm:grid-cols-1 max-md:grid-cols-2 my-8 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-5">
            {sewaks.team.map((sewak, idx) => (
              <li className="flex flex-col p-1 gap-1 bg-blue-30 backdrop-blur-lg rounded-[8px]" key={idx}>
                <div className="relative grow aspect-square rounded-[4px] overflow-clip">
                  <Image fill className="object-cover w-full h-full" src={sewak.imgUrl} alt={sewak.name} />
                </div>
                <div className="bg-white-70 text-black backdrop-blur-lg rounded-[4px] ps-[1.2rem] p-2 font-medium">
                  <p title={sewak.name}>{sewak.name}</p>
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
                    href="#apply"
                    className="flex p-1 rounded-[0.8rem] bg-blue-30 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl"
                  >
                    <div className="px-3 py-2 rounded-[0.4rem] bg-blue-60 gap-1 flex items-center">
                      <span>Apply</span>
                      <MaterialSymbol icon="arrow_outward" />
                    </div>
                  </Link>
                  <Link href="/team#rules" className="flex items-center text-black">
                    See Rules
                  </Link>
                </div>
              </div>
            }
          />
        </Container>
      </section>
      <section id="rules" className="scroll-mt-[12vh]">
        rules
      </section>
    </main>
  );
};

export default Team;
