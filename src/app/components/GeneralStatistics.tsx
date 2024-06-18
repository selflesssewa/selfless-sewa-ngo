import { getStatisticsCached } from "@/dao";
import GlowCard from "./GlowCard";
import { AnimatedNumber } from "./AnimatedNumber";

export const GeneralStatistics = async () => {
  const { generalStatistics } = await getStatisticsCached();

  return (
    <GlowCard className="p-[0px]">
      <ul className="grid grid-cols-2 place-content-end md:grid-cols-3">
        {generalStatistics.map((stat, idx) => (
          <li
            className="border-r border-white/25 p-3 drop-shadow md:px-4 md:[&:nth-child(-n+3)]:border-b max-md:[&:nth-child(-n+4)]:border-b max-md:[&:nth-child(2n)]:border-r-0 md:[&:nth-child(3n)]:border-r-0"
            key={idx}
          >
            <p className="text-nowrap text-headline-md tabular-nums opacity-80 duration-200 has-[[data-done]]:opacity-100 lg:text-display-sm">
              <AnimatedNumber as="span" to={stat.value} />
              <span className="normal-nums">{stat.suffix}</span>
            </p>
            <p className="text-body-md max-sm:tracking-wider sm:text-body-lg">
              {stat.title}
            </p>
          </li>
        ))}
      </ul>
    </GlowCard>
  );
};
