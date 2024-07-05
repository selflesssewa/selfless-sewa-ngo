import { getHomePageContent } from "@/dao";
import Image from "next/image";
import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import CallToActionCard from "./components/CallToActionCard";
import Map from "./components/Map";
import Container from "./components/Container";
import HeroSlider from "./components/HeroSlider";
import TestimonialSlider from "./components/TestimonialSlider";
import GlowCard from "./components/GlowCard";
import { GeneralStatistics } from "./components/GeneralStatistics";

const beliefs = [
    "We embrace service as more than just duty, it’s a profound calling that shapes our every action.",
    "We believe that by placing the needs of others before our own, we can ignite a positive change on a global scale.",
    "Our motto sums up our ethos, inspiring us to serve with dedication, genuine humility, and boundless compassion.",
    "Embody these principles, fostering a culture of selflessness and empowerment within ourselves and beyond.",
  ] as const,
  missionText =
    "Eliminating barriers through education, fostering wellness with healthcare, ensuring sustenance with food security, promoting dignity through menstrual hygiene awareness, nurturing compassion for animal welfare, and safeguarding our planet through environmental sustainability.",
  visionText =
    "Envisioning a world where barriers to education, healthcare, menstrual hygiene, food security, and holistic well-being are eradicated, nurturing a future where every individual thrives with vitality and embraces well-being.";

export const projects = [
  {
    id: "saksham",
    title: "Saksham",
    hindiTitle: "सक्षम",
    icon: "auto_stories",
    description:
      "Empowering individuals through education and skill development for a brighter future.",
    body: "In Project सक्षम (Saksham), we are committed to breaking the cycle of inequality by providing access to quality education and skill development opportunities. Through our various initiatives, we aim to equip individuals with the knowledge, skills including gross & motor skills and confidence they need to build a better future for themselves and their communities. Our programs range from formal education support, such as scholarships and tutoring, to vocational training in trades like carpentry, sewing, and computer literacy. We believe that education is the key to unlocking potential and creating lasting change, and we are dedicated to ensuring that everyone has the opportunity to thrive.",
  },
  {
    id: "chikitsa",
    title: "Chikitsa",
    hindiTitle: "चिकित्सा",
    icon: "digital_wellbeing",
    description:
      "Promoting healthcare access and menstrual hygiene for holistic well-being.",
    body: "In Project चिकित्सा (Chikitsa) focuses on promoting healthcare access and menstrual hygiene to improve the overall well-being of individuals and communities. We understand the critical importance of access to healthcare services and menstrual hygiene products in ensuring the health and dignity of all individuals, especially women and girls. Through this project, we provide essential healthcare services, including medical camps, health screenings, and vaccinations, as well as distribute menstrual hygiene products and conduct awareness campaigns to break the stigma surrounding menstruation. Our goal is to ensure that everyone has access to the healthcare they need and the resources to maintain their health and hygiene with dignity.",
  },
  {
    id: "aahar",
    title: "Aahar",
    hindiTitle: "आहार",
    icon: "grocery",
    description:
      "Eradicating hunger by providing nutritious meals and sustainable food solutions.",
    body: "In Project आहार (Aahar), we are dedicated to eradicating hunger and food insecurity by providing nutritious meals and implementing sustainable food solutions. We recognize that access to adequate and nutritious food is a basic human right, yet millions of people around the world suffer from hunger every day. Through our food distribution programs, community kitchens, and agricultural initiatives, we strive to ensure that no one goes hungry. Additionally, we promote sustainable food practices such as organic farming, community gardens, and food waste reduction to create long-term solutions to food insecurity and promote environmental sustainability.",
  },
  {
    id: "saundarya",
    title: "Saundarya",
    hindiTitle: "सौन्दर्य",
    icon: "nature",
    description:
      "Nurturing environmental well-being through cleanliness and plantation initiatives.",
    body: "In Project सौन्दर्य (Saundarya) is dedicated to nurturing environmental well-being through cleanliness and plantation initiatives. We understand the importance of preserving and protecting our environment for current and future generations. Through our cleanliness drives, waste management programs, and tree plantation efforts, we work to create clean, green, and sustainable communities. By engaging volunteers and community members in these initiatives, we not only improve the physical environment but also foster a sense of environmental stewardship and responsibility.",
  },
  {
    id: "jeev-kalyan",
    title: "Jeev Kalyan",
    hindiTitle: "जीवकल्याण",
    icon: "pets",
    description:
      "Advocating for Animal Welfare, ensuring compassion for all living being.",
    body: "In Project जीवकल्याण (Jeev Kalyan), we advocate for animal welfare and work to ensure compassion for all living beings. We believe that animals deserve to be treated with kindness, respect, and dignity, and we are committed to protecting their rights and well-being. Through our animal rescue and rehabilitation efforts, vaccination drives, and advocacy campaigns, we strive to create a world where animals are valued and cared for. Additionally, we promote responsible pet ownership and humane treatment of animals in communities. Our goal is to build a society where humans and animals coexist harmoniously, with compassion and empathy for all living beings.",
  },
] as const;

export const projectIconClasses = {
  saksham: "bg-saksham",
  chikitsa: "bg-chikitsa",
  aahar: "bg-aahar",
  saundarya: "bg-saundarya",
  "jeev-kalyan": "bg-jeev-kalyan",
} as const;

export default async function Home() {
  const {
    sliderImgUrls,
    missionImgUrls,
    visionImgUrls,
    locations,
    testimonials,
    donationFormLink,
  } = await getHomePageContent();

  return (
    <main className="min-h-screen">
      <section className="mb-17 flex flex-col gap-8 pt-4 md:pt-6 lg:pt-10">
        <Container className="flex items-end justify-start gap-3 max-lg:flex-col max-lg:items-start">
          <div className="flex flex-col items-start gap-2">
            <ul className="flex flex-wrap gap-2">
              <li className="flex items-center gap-1 rounded-[4px] border border-white/10 bg-white/10 px-1 text-body-md tracking-wider backdrop-blur-sm">
                <MaterialSymbol icon="verified_user" color="gold" />
                12A & 80G Certified
              </li>
              <li className="flex items-center gap-1 rounded-[4px] border border-white/10 bg-white/10 px-1 text-body-md tracking-wider backdrop-blur-sm">
                <MaterialSymbol icon="verified" color="gold" />
                Registered under The Indian Trusts Act, 1882
              </li>
              <li className="flex items-center gap-1 rounded-[4px] border border-white/10 bg-white/10 px-1 text-body-md tracking-wider backdrop-blur-sm">
                <MaterialSymbol icon="handshake" color="gold" />
                Affiliated with Niti Aayog through NGO Darpan
              </li>
            </ul>
            <h1 className="font-display title-drop-shadow origin-bottom-left text-balance text-headline-md font-normal tracking-tight md:text-headline-lg lg:text-display-sm">
              Join our commitment to making a positive difference in the world.
            </h1>
          </div>
          <Link
            href="/donate"
            // href={donationFormLink}
            // target="_blank"
            className="flex flex-shrink-0 rounded-[0.8rem] bg-green-50 p-1 shadow-xl shadow-blue-30 backdrop-blur-lg transition-[filter,transform] duration-150 ease-in hover:scale-105 hover:saturate-150"
          >
            <div className="flex items-center gap-2 rounded-[0.4rem] bg-green/50 px-4 py-2 ps-3 max-sm:py-0 max-sm:ps-2">
              <MaterialSymbol
                icon="volunteer_activism"
                weight={300}
                size={48}
              />
              <div className="flex flex-col items-start">
                <span className="text-title-lg font-medium tracking-normal">
                  Make a Donation
                </span>
                <span className="font-medium">help a soul in need</span>
              </div>
            </div>
          </Link>
        </Container>
        <HeroSlider images={sliderImgUrls} />
      </section>
      <section>
        <Container className="mb-12 flex flex-col items-center md:mb-17">
          <MaterialSymbol
            icon="flare"
            weight={200}
            size={40}
            className="mb-2"
          />
          <h2 className="mb-4 text-center tracking-wider">Our Core Belief</h2>
          <h3 className="font-display mb-7 text-center text-headline-lg font-light italic tracking-tight md:mb-10 md:text-display-sm">
            Service Above Self
          </h3>
          <div className="grid auto-cols-fr auto-rows-auto gap-3 sm:grid-cols-2 md:gap-4">
            {beliefs.map((belief, idx) => (
              <GlowCard key={idx} className="md:max-w-[35ch]">
                <p className="text-pretty drop-shadow-md">{belief}</p>
              </GlowCard>
            ))}
          </div>
        </Container>
      </section>
      <section className="px-3 py-8 pb-16 lg:px-10 lg:py-18">
        <div className="flex items-stretch rounded-[24px] bg-white-70 text-black backdrop-blur-lg max-md:flex-col">
          <div className="p-5 pt-6 md:w-[50%] md:py-7 md:pe-4 md:ps-9">
            <h2 className="mb-3 text-headline-sm tracking-normal">
              Our Mission
            </h2>
            <p className="text-balance">{missionText}</p>
          </div>
          <div className="relative grow max-md:h-[50vh]">
            <div className="absolute left-[50%] h-[100%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:h-[60%] max-md:w-[calc(100%+1.2rem)] max-md:-translate-x-1/2 md:left-[0px] md:top-[40%] md:w-[60%] md:-translate-y-1/2">
              <Image
                className="object-cover"
                src={missionImgUrls[0]}
                alt=""
                fill
              />
            </div>
            <div className="absolute right-[calc(60%+1.6rem)] h-[70%] w-[30%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:top-[calc(60%+1.6rem)] max-md:h-[30%] md:bottom-[calc(45%+1.6rem)] md:left-[calc(60%+1.6rem)] md:w-[30%]">
              <Image
                className="object-cover"
                src={missionImgUrls[1]}
                alt=""
                fill
              />
            </div>
            <div className="absolute left-[40%] top-[calc(60%+1.6rem)] h-[60%] w-[55%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:h-[50%] md:left-[calc(60%+1.6rem)] md:top-[55%] md:w-[35%]">
              <Image
                className="object-cover"
                src={missionImgUrls[2]}
                alt=""
                fill
              />
            </div>
          </div>
        </div>
      </section>
      <section className="px-3 py-14 lg:px-10 lg:py-18">
        <div className="flex items-stretch rounded-[24px] bg-white-70 text-black backdrop-blur-lg max-md:flex-col">
          <div className="relative grow max-md:h-[50vh]">
            <div className="absolute h-[100%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:left-[50%] max-md:h-[60%] max-md:w-[calc(100%+1.2rem)] max-md:-translate-x-1/2 md:right-[0px] md:top-[40%] md:w-[60%] md:-translate-y-1/2">
              <Image
                className="object-cover"
                src={visionImgUrls[0]}
                alt=""
                fill
              />
            </div>
            <div className="absolute right-[calc(45%+1.6rem)] h-[80%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:top-[calc(60%+1.6rem)] max-md:h-[40%] max-md:w-[45%] md:bottom-[calc(45%+1.6rem)] md:right-[calc(60%+1.6rem)] md:w-[30%]">
              <Image
                className="object-cover"
                src={visionImgUrls[1]}
                alt=""
                fill
              />
            </div>
            <div className="absolute top-[calc(60%+1.6rem)] h-[60%] w-[40%] overflow-clip rounded-[16px] shadow-2xl shadow-blue-60 max-md:left-[55%] max-md:h-[30%] md:right-[calc(60%+1.6rem)] md:top-[55%] md:w-[35%]">
              <Image
                className="object-cover"
                src={visionImgUrls[2]}
                alt=""
                fill
              />
            </div>
          </div>
          <div className="p-5 pt-6 max-md:-order-1 md:w-[50%] md:py-7 md:pe-9 md:ps-6">
            <h2 className="mb-3 text-headline-sm tracking-normal">
              Our Vision
            </h2>
            <p className="text-balance">{visionText}</p>
          </div>
        </div>
      </section>
      <section>
        <Container className="py-8 md:py-12">
          <h2 className="mb-8 text-center tracking-wider">Our Impact</h2>
          <div className="mt-6 md:mt-8">
            <GeneralStatistics />
          </div>
        </Container>
      </section>
      <section>
        <Container className="py-10 max-md:ps-4 md:py-17">
          <h2 className="mb-8 text-center tracking-wider">Our Projects</h2>
          <div className="flex flex-col gap-10 md:gap-16">
            {projects.map((p) => (
              <div
                className="grid grid-cols-[auto,1fr] items-center justify-items-start gap-x-3 md:gap-x-6"
                key={p.id}
              >
                <span className="font-display col-start-2 italic tracking-wider">
                  Project
                </span>
                <div className="rounded-full border border-white/10 bg-white/10 p-1 shadow-sm shadow-blue-30 backdrop-blur-lg max-md:p-0">
                  <div className="max-md:hidden">
                    <MaterialSymbol
                      icon={p.icon}
                      size={32}
                      weight={400}
                      className={twMerge(
                        "rounded-full p-3 text-black/60",
                        projectIconClasses[p.id],
                      )}
                    />
                  </div>
                  <div className="md:hidden">
                    <MaterialSymbol
                      icon={p.icon}
                      size={24}
                      weight={400}
                      className={twMerge(
                        "rounded-full p-2 text-black/60",
                        projectIconClasses[p.id],
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
                <p className="col-start-2 mt-2 font-light drop-shadow-md md:text-title-md">
                  {p.description}
                </p>
                <Link
                  href={"/projects#" + p.id}
                  className="col-start-2 mt-4 rounded-[8px] border border-white/10 bg-white/10 p-1 px-3 text-body-lg drop-shadow-sm backdrop-blur-sm transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
                >
                  Read more
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section>
        <Container className="my-12 max-md:p-[0px]">
          <TestimonialSlider testimonials={testimonials} />
        </Container>
      </section>
      <section>
        <Container className="my-12 md:mt-20">
          <h2 className="mb-3 text-balance text-center text-headline-sm tracking-normal max-md:mb-2 max-md:text-title-md">
            Our Weekly On-field Drives
          </h2>
          <Map points={locations} />
        </Container>
      </section>
      <section>
        <Container className="my-8 mb-14 flex min-h-[60vh] items-center">
          <CallToActionCard
            title="Make a positive change"
            body="With compassion and empathy at our core, we strive to make a positive difference in people's lives. This dedication is evident in our volunteer-driven initiatives and collaborative partnerships, aimed at providing education and healthcare to under-served communities. Together, Lets serve before ourselves."
            imgSrc="/images/IMG_3202.webp"
            imgAltText="group photo"
            footer={
              <Link
                href="/donate"
                // href={donationFormLink}
                // target="_blank"
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
}
