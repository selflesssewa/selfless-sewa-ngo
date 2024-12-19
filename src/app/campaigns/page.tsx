import { getCampaignPageContent } from "@/dao";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { BLOCKS, MARKS } from "@contentful/rich-text-types";
import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import CallToActionCard from "../components/CallToActionCard";
import Container from "../components/Container";
import GlowCard from "../components/GlowCard";

const Project = async () => {
  const { campaigns } = await getCampaignPageContent();

  return (
    <main className="min-h-screen pt-14">
      <Container className="mb-14 flex flex-col gap-14 md:mb-17 md:gap-20">
        {campaigns.map((c) => (
          <section id={c.slug} key={c.slug}>
            <div
              className={twMerge(
                "flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-tl from-white/15 to-white/5 p-3 backdrop-blur-lg",
                c.active && "bg-gradient-to-br from-blue-60 to-blue-30",
              )}
            >
              <div className="flex flex-grow items-start justify-between">
                <h3 className="font-display text-headline-md tracking-normal md:text-headline-lg">
                  {c.title}
                </h3>
                {c.active && (
                  <span className="flex-shrink-0 rounded-[4px] bg-white px-1 text-body-lg font-semibold tracking-wider text-blue">
                    ACTIVE&nbsp;NOW
                  </span>
                )}
              </div>
              <div className="no-scrollbar -mx-5 flex snap-x snap-proximity scroll-px-2 gap-2 overflow-x-auto px-2 empty:hidden md:-mx-6 md:scroll-px-0 md:rounded-md md:px-0">
                {c.imgUrls?.map((url) => (
                  <img
                    src={url}
                    key={url}
                    className="h-[25vh] max-h-[420px] min-h-[320px] w-auto snap-start rounded-3xl md:h-[35vh] lg:h-[55vh]"
                    alt=""
                  />
                ))}
              </div>
            </div>
            <article className="mt-4 drop-shadow-md md:mt-6 md:text-title-sm [&_p]:max-w-[55ch] [&_p]:text-pretty">
              {documentToReactComponents(c.content, {
                renderNode: {
                  [BLOCKS.EMBEDDED_ASSET]: (node) => {
                    const data = node.data.target.fields;
                    return (
                      <GlowCard className="-mx-1 my-6 overflow-clip p-1 shadow-lg drop-shadow-none backdrop-blur-none first:mt-[0px]">
                        <Image
                          priority
                          src={"https:" + data.file.url}
                          alt={data.description}
                          className="max-h-[70vh] w-full max-w-prose rounded object-cover drop-shadow-none"
                          width={900}
                          height={900}
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
                renderMark: {
                  [MARKS.UNDERLINE]: (text) => (
                    <span className="-mx-[0.2em] rounded-md border border-blue bg-gradient-to-r from-blue-60 via-blue-30 to-blue-60 px-[0.2em]">
                      {text}
                    </span>
                  ),
                },
              })}
            </article>
            <Link
              href="/donate"
              className="mt-6 inline-block rounded-[8px] border border-blue-30 bg-blue-30 p-1 px-3 backdrop-blur-sm transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150 max-md:col-span-2 md:col-start-2"
            >
              Donate
            </Link>
          </section>
        ))}
      </Container>
      <section>
        <Container className="my-8 mb-14 flex min-h-[60vh] items-center">
          <CallToActionCard
            title="Towards a better tomorrow"
            body="With compassion and empathy at our core, we strive to make a positive difference in people's lives. This dedication is evident in our volunteer-driven initiatives and collaborative partnerships, aimed at providing education and healthcare to under-served communities. Together, Lets serve before ourselves."
            imgSrc="/images/IMG_5247.webp"
            imgAltText="group photo"
            footer={
              <Link
                href="/donate"
                className="mt-8 flex self-start rounded-[0.8rem] bg-green-50 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
              >
                <div className="flex items-center rounded-[0.4rem] bg-green/50 px-3 py-2">
                  <span className="text-title-md">Donate</span>
                </div>
              </Link>
            }
          />
        </Container>
      </section>
    </main>
  );
};

export default Project;
