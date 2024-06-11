import { getStatisticsCached } from "@/dao";
import GlowCard from "./GlowCard";
import { AnimatedNumber } from "./AnimatedNumber";

export const GeneralStatistics = async () => {
  const { generalStatistics } = await getStatisticsCached();

  return (
    <GlowCard className="p-[0px]">
      <ul className="grid grid-cols-2 md:grid-cols-3 place-content-end">
        {generalStatistics.map((stat, idx) => (
          <li
            className="md:[&:nth-child(-n+3)]:border-b max-md:[&:nth-child(-n+4)]:border-b md:[&:nth-child(3n)]:border-r-0 border-r p-3 md:px-4 border-white/25 max-md:[&:nth-child(2n)]:border-r-0 drop-shadow"
            key={idx}
          >
            <p className="text-headline-md has-[[data-done]]:opacity-100 opacity-80 duration-200 lg:text-display-sm tabular-nums text-nowrap">
              <AnimatedNumber as="span" to={stat.value} />
              <span className="normal-nums">{stat.suffix}</span>
            </p>
            <p className="text-body-md sm:text-body-lg max-sm:tracking-wider">{stat.title}</p>
          </li>
        ))}
      </ul>
    </GlowCard>
  );
};
