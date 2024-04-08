import { getRules } from "@/dao";
import Container from "../components/Container";
import { MaterialSymbol } from "react-material-symbols";
import Link from "next/link";

const Volunteer = async () => {
  const rules = await getRules();

  return (
    <main className="min-h-screen">
      <section>
        <Container className="flex items-center flex-col my-12  md:my-17">deps</Container>
      </section>
      <section id="rules" className="scroll-mt-[16vh]">
        <Container className="flex items-center flex-col my-12 md:my-17">
          <div className="bg-white-70 text-black overflow-hidden backdrop-blur-lg pb-3 rounded-[24px]">
            <h2 className="text-headline-sm p-4 pb-3 tracking-normal bg-white-70">Volunteering Rules</h2>
            <ul className="select-text selection:bg-dark-text-selection flex flex-col divide-y-[1px] max-w-prose divide-blue-30">
              {rules.volunteerRules.map((rule, idx) => (
                <li className="p-3 px-4 flex gap-3 items-baseline tracking-wider">
                  <span className="font-bold">{idx + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </Container>
        <Container className="flex items-center flex-col my-12 md:my-17">
          <div className="bg-white-70 text-black overflow-hidden backdrop-blur-lg pb-3 rounded-[24px]">
            <h2 className="text-headline-sm p-4 pb-3 tracking-normal bg-white-70">Certification Criteria</h2>
            <ul className="select-text selection:bg-dark-text-selection flex flex-col divide-y-[1px] max-w-prose divide-blue-30">
              {rules.certificateCriteria.map((rule, idx) => (
                <li className="p-3 px-4 flex gap-3 items-baseline tracking-wider">
                  <span className="font-bold">{idx + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </Container>
        <Container className="grid place-items-center my-20">
          <Link
            href="#apply"
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
