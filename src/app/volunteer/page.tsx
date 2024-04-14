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
        <Container className="flex items-center flex-col my-12 md:my-17">
          <h2 className="tracking-normal text-headline-sm max-md:mb-7 mb-12">Our Departments</h2>
          <ul className="grid auto-cols-fr max-md:gap-2 gap-4  max-sm:grid-cols-2 grid-cols-3">
            {departments.map(department => (
              <li
                className="relative bg-blue-60 max-w-[32rem] max-sm:aspect-[3/5] aspect-[3/4] backdrop-blur-lg max-sm:rounded-[16px] rounded-[24px] overflow-clip"
                key={department.name}
              >
                <div className="max-sm:p-3 p-4 z-10">
                  <h2 className="md:text-title-md mb-2 leading-tight">{department.name}</h2>
                  <p className="font-light text-body-md max-sm:tracking-wider sm:text-body-lg">
                    {department.description}
                  </p>
                </div>
                <div className="absolute  text-blue-60 max-sm:-left-6 max-lg:-left-7 -left-12 max-sm:bottom-0 max-lg:-bottom-6 -bottom-3 -z-10">
                  <MaterialSymbol
                    className="[font-variation-settings:'opsz'_48,_'wght'_300] max-sm:text-[180px] max-lg:text-[200px] text-[320px]"
                    icon={department.icon as SymbolCodepoints}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section id="rules" className="scroll-mt-[16vh]">
        <Container className="flex items-center flex-col my-12 md:my-17">
          <List title="Volunteering Rules" list={data.volunteerRules} />
        </Container>
        <Container className="flex items-center flex-col my-12 md:my-17">
          <List title="Certification Criteria" list={data.certificateCriteria} />
        </Container>
        <Container className="grid place-items-center my-18">
          <Link
            href={data.volunteerFormLink}
            target="_blank"
            className="flex p-1 rounded-[0.8rem] bg-blue-30 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl"
          >
            <div className="px-3 py-2 rounded-[0.4rem] bg-blue-60 gap-1 flex items-center">
              <span>Become A Sewak</span>
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
    <div className="bg-white-70 text-black overflow-hidden backdrop-blur-lg pb-3 rounded-[24px]">
      <h2 className="text-headline-sm p-4 pb-3 tracking-normal bg-white-70">{title}</h2>
      <ul className="select-text selection:bg-dark-text-selection flex flex-col divide-y-[1px] max-w-prose divide-blue-30">
        {list.map((rule, idx) => (
          <li className="p-3 px-4 flex gap-3 items-baseline" key={idx}>
            <span className="font-bold underline underline-offset-2 text-blue-60">{idx + 1}</span>
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
};
