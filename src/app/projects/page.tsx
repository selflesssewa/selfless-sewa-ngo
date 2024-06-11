import { getProjectPageContent } from "@/dao";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import Container from "../components/Container";
import { GeneralStatistics } from "../components/GeneralStatistics";
import { projectIconClasses, projects } from "../page";

const Project = async () => {
  const { donationFormLink } = await getProjectPageContent();

  return (
    <main className="min-h-screen">
      <section>
        <Container className="my-4 md:ps-16">
          <h1 className=" tracking-normal text-headline-sm mb-4 mt-7">Our Projects</h1>
          <p className="max-w-[55ch] md:text-title-md font-light drop-shadow-md">
            Selfless Sewa, where we believe in making a meaningful impact through our diverse range of projects. Our
            initiatives are dedicated to fostering positive change in society by addressing crucial issues such as
            quality education, healthcare accessibility, menstrual hygiene, animal welfare, food donation, and
            cleanliness.
            <br />
            <br />
            Through our dedicated efforts and unwavering commitment, we strive to create a world where every individual
            has the opportunity to thrive and live a dignified life. We&apos;re on our journey towards building a
            brighter, more compassionate future for all.
          </p>
          <div className="mt-6 md:mt-8">
            <GeneralStatistics />
          </div>
        </Container>
      </section>
      <Container className=" md:my-17 my-14 max-md:ps-4 flex flex-col md:gap-16 gap-12">
        {projects.map(p => (
          <section
            id={p.id}
            className="grid gap-x-3 scroll-mt-[12vh] md:gap-x-6 items-center grid-cols-[auto,1fr] justify-items-start"
            key={p.id}
          >
            <span className="col-start-2 italic font-display tracking-wider">Project</span>
            <div className="max-md:p-0 p-1 bg-white/10 border border-white/10 backdrop-blur-lg rounded-full">
              <div className="max-md:hidden">
                <MaterialSymbol
                  icon={p.icon}
                  size={36}
                  weight={400}
                  className={twMerge("rounded-full p-3 text-black/70", projectIconClasses[p.id])}
                />
              </div>
              <div className="md:hidden">
                <MaterialSymbol
                  icon={p.icon}
                  size={24}
                  weight={400}
                  className={twMerge("rounded-full p-2 text-black/70", projectIconClasses[p.id])}
                />
              </div>
            </div>
            <h3 className="font-display text-headline-md md:text-headline-lg tracking-tight">{p.title}</h3>
            <p className="font-hindi text-title-lg md:text-headline-sm font-medium max-md:mt-1 col-start-2">
              {p.hindiTitle}
            </p>
            <p className="md:col-start-2 drop-shadow-md max-md:col-span-2 md:text-title-md font-light mt-4 text-balance max-w-[55ch]">
              {p.body}
            </p>
            <Link
              href={donationFormLink}
              target="_blank"
              className="p-1 px-3 mt-5 md:col-start-2 max-md:col-span-2 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-sm bg-blue-30 border border-blue-30 rounded-[8px]"
            >
              Donate
            </Link>
          </section>
        ))}
      </Container>
    </main>
  );
};

export default Project;
