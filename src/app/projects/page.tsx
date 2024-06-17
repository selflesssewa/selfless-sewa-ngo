import { getProjectPageContent, projectIcons } from "@/dao";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS } from "@contentful/rich-text-types";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import Container from "../components/Container";
import { GeneralStatistics } from "../components/GeneralStatistics";
import { projectIconClasses } from "../page";
import GlowCard from "../components/GlowCard";

const Project = async () => {
  const { donationFormLink, projects } = await getProjectPageContent();

  return (
    <main className="min-h-screen">
      <section>
        <Container className="my-4 md:ps-16">
          <h1 className="mb-4 mt-7 text-headline-sm tracking-normal">
            Our Projects
          </h1>
          <p className="max-w-[55ch] font-light drop-shadow-md md:text-title-md">
            Selfless Sewa, where we believe in making a meaningful impact
            through our diverse range of projects. Our initiatives are dedicated
            to fostering positive change in society by addressing crucial issues
            such as quality education, healthcare accessibility, menstrual
            hygiene, animal welfare, food donation, and cleanliness.
            <br />
            <br />
            Through our dedicated efforts and unwavering commitment, we strive
            to create a world where every individual has the opportunity to
            thrive and live a dignified life. We&apos;re on our journey towards
            building a brighter, more compassionate future for all.
          </p>
          <div className="mt-6 md:mt-8">
            <GeneralStatistics />
          </div>
        </Container>
      </section>
      <Container className="my-14 flex flex-col gap-12 md:my-17 md:gap-16">
        {projects.map((p) => (
          <section
            id={p.slug}
            className="grid scroll-mt-[12vh] grid-cols-[auto,1fr] items-center justify-items-start gap-x-3 md:gap-x-6"
            key={p.slug}
          >
            <span className="font-display col-start-2 italic tracking-wider">
              Project
            </span>
            <div className="rounded-full border border-white/10 bg-white/10 p-1 backdrop-blur-lg max-md:p-0">
              <div className="max-md:hidden">
                <MaterialSymbol
                  icon={projectIcons[p.slug]}
                  size={36}
                  weight={400}
                  className={twMerge(
                    "rounded-full p-3 text-black/70",
                    projectIconClasses[
                      p.slug as keyof typeof projectIconClasses
                    ],
                  )}
                />
              </div>
              <div className="md:hidden">
                <MaterialSymbol
                  icon={projectIcons[p.slug]}
                  size={24}
                  weight={400}
                  className={twMerge(
                    "rounded-full p-2 text-black/70",
                    projectIconClasses[
                      p.slug as keyof typeof projectIconClasses
                    ],
                  )}
                />
              </div>
            </div>
            <h3 className="font-display text-headline-md tracking-tight md:text-headline-lg">
              {p.title}
            </h3>
            <p className="font-hindi col-start-2 text-title-lg font-medium max-md:mt-1 md:text-headline-sm">
              {p.hindiTitle}
            </p>
            <article className="mt-4 drop-shadow-md max-md:col-span-2 md:col-start-2 [&_p]:max-w-[55ch] [&_p]:text-pretty [&_p]:md:text-title-sm">
              {documentToReactComponents(p.body, {
                renderNode: {
                  [BLOCKS.EMBEDDED_ASSET]: (node) => {
                    const data = node.data.target.fields;
                    return (
                      <GlowCard className="-m-1 p-1 drop-shadow-none sm:-m-2 sm:p-2">
                        <Image
                          src={"https:" + data.file.url}
                          alt={data.description}
                          className="w-full max-w-prose rounded object-cover drop-shadow-none"
                          width={900}
                          height={600}
                        />
                      </GlowCard>
                    );
                  },
                },
                renderText: (text) => {
                  return text
                    .split("\n")
                    .reduce((children, textSegment, index) => {
                      return [
                        ...children,
                        index > 0 && <br key={index} />,
                        textSegment,
                      ] as string[];
                    }, [] as string[]);
                },
              })}
            </article>
            <Link
              href={donationFormLink}
              target="_blank"
              className="mt-5 rounded-[8px] border border-blue-30 bg-blue-30 p-1 px-3 backdrop-blur-sm transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150 max-md:col-span-2 md:col-start-2"
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
