import { getVolunteerPageContent } from "@/dao";
import Container from "../components/Container";
import { MaterialSymbol, type SymbolCodepoints } from "react-material-symbols";
import Link from "next/link";

const departments = [
  {
    icon: "groups",
    name: "Human Resources & Management",
    description: "Cultivating talent & fostering supportive workplace culture.",
  },
  {
    icon: "package_2",
    name: "Operations & Logistics",
    description: "Efficiently delivering aid where it's needed.",
  },
  {
    icon: "calculate",
    name: "Finance & Budgeting",
    description: "Managing funds wisely to maximize impact.",
  },
  {
    icon: "news",
    name: "Social Media & Content",
    description: "Spreading our message far and wide.",
  },
  {
    icon: "edit_calendar",
    name: "Research & Planning",
    description: "Guiding our actions with solid data & a plan of action.",
  },
  {
    icon: "hub",
    name: "Public Relations & Outreach",
    description: "Connecting with communities to drive change.",
  },
] as const;

const Volunteer = async () => {
  const data = await getVolunteerPageContent();

  return (
    <main className="min-h-screen">
      <section id="departments" className="scroll-mt-[16vh]">
        <Container className="my-12 flex flex-col items-center md:my-17">
          <h2 className="mb-12 text-headline-sm tracking-normal max-md:mb-7">
            Our Departments
          </h2>
          <ul className="grid auto-cols-fr grid-cols-3 gap-4 max-md:gap-2 max-sm:grid-cols-2">
            {departments.map((department) => (
              <li
                className="relative aspect-[3/4] max-w-[28rem] overflow-clip rounded-[24px] bg-blue-60 backdrop-blur-lg max-sm:aspect-[2/3] max-sm:rounded-[16px]"
                key={department.name}
              >
                <div className="z-10 p-4 max-sm:p-3">
                  <h2 className="mb-2 leading-tight md:text-title-md">
                    {department.name}
                  </h2>
                  <p className="text-body-md font-light max-sm:tracking-wider sm:text-body-lg">
                    {department.description}
                  </p>
                </div>
                <div className="absolute -bottom-1 -left-9 -z-10 text-blue-60 max-lg:-bottom-6 max-lg:-left-7 max-sm:-bottom-2 max-sm:-left-6">
                  <MaterialSymbol
                    className="text-[280px] [font-variation-settings:'opsz'_24,_'wght'_300] max-lg:text-[200px] max-sm:text-[180px]"
                    icon={department.icon as SymbolCodepoints}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section id="rules" className="scroll-mt-[16vh]">
        <Container className="my-12 flex flex-col items-center md:my-17">
          <List title="Volunteering Rules" list={data.volunteerRules} />
        </Container>
        <Container className="my-12 flex flex-col items-center md:my-17">
          <List
            title="Certification Criteria"
            list={data.certificateCriteria}
          />
        </Container>
        <Container className="my-18 grid place-items-center">
          <Link
            href={data.volunteerFormLink}
            target="_blank"
            className="flex rounded-[0.8rem] bg-blue-30 p-1 backdrop-blur-2xl transition-[filter,transform] duration-200 hover:scale-105 hover:saturate-150"
          >
            <div className="flex items-center gap-1 rounded-[0.4rem] bg-blue-60 px-3 py-2">
              <span>Become A सेवक</span>
              <MaterialSymbol icon="arrow_outward" />
            </div>
          </Link>
        </Container>
      </section>
    </main>
  );
};

export default Volunteer;

const List = ({ title, list }: { title: string; list: string[] }) => {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white-70 pb-3 text-black backdrop-blur-lg">
      <h2 className="bg-white-70 p-4 pb-3 text-headline-sm tracking-normal">
        {title}
      </h2>
      <ul className="flex max-w-prose select-text flex-col divide-y-[1px] divide-blue-30 selection:bg-dark-text-selection">
        {list.map((rule, idx) => (
          <li className="flex items-baseline gap-3 p-3 px-4" key={idx}>
            <span className="font-bold text-blue-60 underline underline-offset-2">
              {idx + 1}
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
};
