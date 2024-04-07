import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import Container from "./components/Container";
import HeroSlider from "./components/HeroSlider";
import Image from "next/image";
import CallToActionCard from "./components/CallToActionCard";
import { twMerge } from "tailwind-merge";

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
    description: "Empowering individuals through education and skill development for a brighter future.",
    body: "In Project सक्षम (Saksham), we are committed to breaking the cycle of inequality by providing access to quality education and skill development opportunities. Through our various initiatives, we aim to equip individuals with the knowledge, skills including gross & motor skills and confidence they need to build a better future for themselves and their communities. Our programs range from formal education support, such as scholarships and tutoring, to vocational training in trades like carpentry, sewing, and computer literacy. We believe that education is the key to unlocking potential and creating lasting change, and we are dedicated to ensuring that everyone has the opportunity to thrive.",
  },
  {
    id: "chikitsa",
    title: "Chikitsa",
    hindiTitle: "चिकित्सा",
    icon: "digital_wellbeing",
    description: "Promoting healthcare access and menstrual hygiene for holistic well-being.",
    body: "In Project चिकित्सा (Chikitsa) focuses on promoting healthcare access and menstrual hygiene to improve the overall well-being of individuals and communities. We understand the critical importance of access to healthcare services and menstrual hygiene products in ensuring the health and dignity of all individuals, especially women and girls. Through this project, we provide essential healthcare services, including medical camps, health screenings, and vaccinations, as well as distribute menstrual hygiene products and conduct awareness campaigns to break the stigma surrounding menstruation. Our goal is to ensure that everyone has access to the healthcare they need and the resources to maintain their health and hygiene with dignity.",
  },
  {
    id: "aahar",
    title: "Aahar",
    hindiTitle: "आहार",
    icon: "grocery",
    description: "Eradicating hunger by providing nutritious meals and sustainable food solutions.",
    body: "In Project आहार (Aahar), we are dedicated to eradicating hunger and food insecurity by providing nutritious meals and implementing sustainable food solutions. We recognize that access to adequate and nutritious food is a basic human right, yet millions of people around the world suffer from hunger every day. Through our food distribution programs, community kitchens, and agricultural initiatives, we strive to ensure that no one goes hungry. Additionally, we promote sustainable food practices such as organic farming, community gardens, and food waste reduction to create long-term solutions to food insecurity and promote environmental sustainability.",
  },
  {
    id: "saundarya",
    title: "Saundarya",
    hindiTitle: "सौन्दर्य",
    icon: "nature",
    description: "Nurturing environmental well-being through cleanliness and plantation initiatives.",
    body: "In Project सौन्दर्य (Saundarya) is dedicated to nurturing environmental well-being through cleanliness and plantation initiatives. We understand the importance of preserving and protecting our environment for current and future generations. Through our cleanliness drives, waste management programs, and tree plantation efforts, we work to create clean, green, and sustainable communities. By engaging volunteers and community members in these initiatives, we not only improve the physical environment but also foster a sense of environmental stewardship and responsibility.",
  },
  {
    id: "jeev-kalyan",
    title: "Jeev Kalyan",
    hindiTitle: "जीवकल्याण",
    icon: "pets",
    description: "Advocating for Animal Welfare, ensuring compassion for all living being.",
    body: "In Project जीवकल्याण (Jeev Kalyan), we advocate for animal welfare and work to ensure compassion for all living beings. We believe that animals deserve to be treated with kindness, respect, and dignity, and we are committed to protecting their rights and well-being. Through our animal rescue and rehabilitation efforts, vaccination drives, and advocacy campaigns, we strive to create a world where animals are valued and cared for. Additionally, we promote responsible pet ownership and humane treatment of animals in communities. Our goal is to build a society where humans and animals coexist harmoniously, with compassion and empathy for all living beings.",
  },
] as const;

export const projectBgColor = {
  saksham: "bg-saksham",
  chikitsa: "bg-chikitsa",
  aahar: "bg-aahar",
  saundarya: "bg-saundarya",
  "jeev-kalyan": "bg-jeev-kalyan",
} as const;

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="pt-4 md:pt-6 lg:pt-10 flex flex-col gap-8 mb-17">
        <Container className="flex items-end max-lg:flex-col max-lg:items-start gap-3 justify-start">
          <div className="flex flex-col items-start gap-2">
            <p className="text-body-lg tracking-wider flex items-center gap-1 bg-white/10 border-white/15 backdrop-blur-sm border-2 px-2 rounded-[8px]">
              <MaterialSymbol color="gold" icon="award_star" />
              Registered under The Indian Trusts Act, 1882
            </p>
            <h1 className="font-display text-headline-md origin-bottom-left md:text-headline-lg lg:text-display-sm text-balance font-normal tracking-tight">
              Join our commitment to making a positive difference in the world.
            </h1>
          </div>
          <Link
            href="#donate"
            className="flex p-1 rounded-[0.8rem] flex-shrink-0 bg-green-50 backdrop-blur-lg hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-150 ease-in"
          >
            <div className="px-4 py-2 max-sm:py-0 max-sm:ps-2 rounded-[0.4rem] bg-green/50 flex gap-2 items-center">
              <MaterialSymbol icon="volunteer_activism" weight={300} size={48} />
              <div className="flex flex-col items-start">
                <span className="font-medium text-title-lg tracking-normal">Make a Donation</span>
                <span className="font-medium">help a soul in need</span>
              </div>
            </div>
          </Link>
        </Container>
        <HeroSlider />
      </section>
      <section>
        <Container className="flex items-center flex-col mb-12  md:mb-17">
          <MaterialSymbol icon="flare" weight={200} size={40} className="mb-2" />
          <h2 className="mb-4 tracking-wider text-center">Our Core Belief</h2>
          <h3 className="font-display text-headline-lg md:text-display-sm tracking-tight italic mb-7 text-center">
            Service Above Self
          </h3>
          <div className="grid md:grid-cols-2 gap-1 bg-blue-60 p-1 backdrop-blur-xl rounded-[8px] auto-rows-fr auto-cols-fr">
            {beliefs.map((belief, idx) => (
              <div className="bg-white-70 text-pretty text-black rounded-[4px] px-4 py-3 md:max-w-[40ch]" key={idx}>
                <p>{belief}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section className="px-3 py-8 pb-16 lg:px-10 lg:py-18">
        <div className="bg-white-70 max-md:flex-col flex items-stretch backdrop-blur-lg text-black rounded-[24px]">
          <div className="md:w-[50%] p-5 pt-6 md:ps-9 md:pe-4 md:py-7">
            <h2 className="text-headline-sm mb-3 tracking-normal">Our Mission</h2>
            <p className="text-balance">{missionText}</p>
          </div>
          <div className="grow max-md:h-[50vh] relative">
            <div className="absolute max-md:h-[60%] md:w-[60%] h-[100%] md:top-[40%] left-[50%] max-md:w-[calc(100%+1.2rem)] md:left-[0px] md:-translate-y-1/2 max-md:-translate-x-1/2  shadow-2xl shadow-blue-60 rounded-[16px] overflow-clip">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
            <div className="absolute md:w-[30%] w-[30%] h-[70%] max-md:h-[30%] md:bottom-[calc(45%+1.6rem)] max-md:top-[calc(60%+1.6rem)] right-[calc(60%+1.6rem)] md:left-[calc(60%+1.6rem)] rounded-[16px] overflow-clip shadow-2xl shadow-blue-60">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
            <div className="absolute md:w-[35%] h-[60%] w-[55%] max-md:h-[50%] left-[40%] top-[calc(60%+1.6rem)] md:top-[55%] md:left-[calc(60%+1.6rem)] rounded-[16px] overflow-clip shadow-2xl shadow-blue-60">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
          </div>
        </div>
      </section>
      <section className="px-3 py-14 lg:px-10 lg:py-18">
        <div className="bg-white-70 max-md:flex-col flex items-stretch backdrop-blur-lg text-black rounded-[24px]">
          <div className="grow max-md:h-[50vh] relative">
            <div className="absolute max-md:h-[60%] md:w-[60%]  h-[100%] md:top-[40%] max-md:w-[calc(100%+1.2rem)] max-md:left-[50%] md:right-[0px] md:-translate-y-1/2 max-md:-translate-x-1/2 shadow-2xl shadow-blue-60 rounded-[16px] overflow-clip">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
            <div className="absolute md:w-[30%] h-[80%] max-md:h-[40%] max-md:w-[45%] md:bottom-[calc(45%+1.6rem)] max-md:top-[calc(60%+1.6rem)] right-[calc(45%+1.6rem)] md:right-[calc(60%+1.6rem)] rounded-[16px] overflow-clip shadow-2xl shadow-blue-60">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
            <div className="absolute md:w-[35%] h-[60%] w-[40%] max-md:h-[30%] max-md:left-[55%] top-[calc(60%+1.6rem)] md:top-[55%] md:right-[calc(60%+1.6rem)] rounded-[16px] overflow-clip shadow-2xl shadow-blue-60">
              <Image className="object-cover" src="/images/IMG_1118.jpeg" alt="" fill />
            </div>
          </div>
          <div className="md:w-[50%] p-5 pt-6  md:pe-9 md:ps-6 md:py-7 max-md:-order-1">
            <h2 className="text-headline-sm mb-3 tracking-normal">Our Vision</h2>
            <p className="text-balance">{visionText}</p>
          </div>
        </div>
      </section>
      <section>
        <Container className=" md:py-17 py-10 max-md:ps-4">
          <h2 className="tracking-wider text-center mb-8">Our Projects</h2>
          <div className="flex md:gap-16 gap-10 flex-col">
            {projects.map(p => (
              <div
                className="grid gap-x-3  md:gap-x-6 items-center grid-cols-[auto,1fr] justify-items-start"
                key={p.id}
              >
                <span className="col-start-2 italic font-display tracking-wider">Project</span>
                <div className="p-1 bg-white-70 backdrop-blur-2xl rounded-full shadow-md shadow-blue-30">
                  <div className="max-md:hidden">
                    <MaterialSymbol
                      icon={p.icon}
                      size={40}
                      weight={400}
                      className={twMerge("rounded-full p-3 text-black/70", projectBgColor[p.id])}
                    />
                  </div>
                  <div className="md:hidden">
                    <MaterialSymbol
                      icon={p.icon}
                      size={24}
                      weight={400}
                      className={twMerge("rounded-full p-2 text-black/70", projectBgColor[p.id])}
                    />
                  </div>
                </div>
                <h3 className="font-display text-headline-lg md:text-display-sm tracking-tight">{p.title}</h3>
                <p className="font-hindi text-headline-sm font-medium max-md:mt-2 col-start-2">{p.hindiTitle}</p>
                <p className="col-start-2 md:text-title-md font-light mt-2">{p.description}</p>
                <Link
                  href={"/projects#" + p.id}
                  className="col-start-2 mt-4 p-1 px-3 rounded-[8px]  bg-white/30 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl "
                >
                  Read more
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <section>
        <Container className="mb-14 py-8 flex items-center min-h-[80vh]">
          <CallToActionCard
            title="Make a positive change"
            body="With compassion and empathy at our core, we strive to make a positive difference in people's lives. This dedication is evident in our volunteer-driven initiatives and collaborative partnerships, aimed at providing education and healthcare to under-served communities. Together, Lets serve before ourselves."
            imgSrc="/images/IMG_1582.jpeg"
            imgAltText=""
            footer={
              <Link
                href="#donate"
                className="flex p-1 self-start mt-8 rounded-[0.8rem] bg-green-50 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl"
              >
                <div className="px-3 py-2 rounded-[0.4rem] bg-green/50 flex items-center">
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
