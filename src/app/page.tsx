import { MaterialSymbol } from "react-material-symbols";
import Container from "./components/Container";
import Link from "next/link";

export default function Home() {
  return (
    <Container className="pt-10 flex items-end gap-3 justify-start">
      <div className="flex flex-col items-start gap-2">
        <p className="text-body-lg tracking-wider flex items-center gap-1 bg-white/10 border-white/15 backdrop-blur-sm border-2 p-0 px-2 rounded-[7px]">
          <MaterialSymbol color="gold" icon="award_star" /> Registered under The Indian Trusts Act, 1882
        </p>
        <h1 className="font-display text-display-sm text-balance font-normal tracking-tight">
          Join our commitment to making a positive difference in the world.
        </h1>
      </div>
      <Link
        href="/team"
        className="flex p-1 rounded-[0.8rem] flex-shrink-0 bg-green-50 backdrop-blur-lg hover:saturate-150 hover:scale-105 transition-[filter,transform] duration-150 ease-in"
      >
        <div className="px-4 py-2 rounded-[0.4rem] bg-green/50 flex gap-2 items-center">
          <MaterialSymbol icon="volunteer_activism" weight={300} size={48} />
          <div className="flex flex-col items-start">
            <span className="font-medium text-title-lg tracking-normal">Make a Donation</span>
            <span className="font-medium">help a soul in need</span>
          </div>
        </div>
      </Link>
    </Container>
  );
}
