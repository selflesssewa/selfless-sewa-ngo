import Link from "next/link";
import { projectBgColor, projects } from "../page";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";
import Container from "../components/Container";

const Project = () => {
  return (
    <main className="min-h-screen">
      <section>
        <Container className="py-14">project intro</Container>
      </section>
      <Container className=" md:py-17 py-14 max-md:ps-4 flex flex-col md:gap-16 gap-12">
        {projects.map(p => (
          <section
            id={p.id}
            className="grid gap-x-3 scroll-mt-[12vh] md:gap-x-6 items-center grid-cols-[auto,1fr] justify-items-start"
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
            <p className="md:col-start-2 max-md:col-span-2 md:text-title-md font-light max-md:mt-4 mt-2 text-balance max-w-[55ch]">
              {p.body}
            </p>
            <Link
              href="#donate"
              className="p-1 md:mt-4 mt-5 md:col-start-2 max-md:col-span-2 hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-200 backdrop-blur-2xl bg-blue-60 rounded-[8px]"
            >
              <div className="p-1 px-3 bg-white/10 rounded-[4px]">Donate</div>
            </Link>
          </section>
        ))}
      </Container>
    </main>
  );
};

export default Project;
