import { twMerge } from "tailwind-merge";

const GlowCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        "text-pretty rounded-[8px] border border-white/10 bg-[radial-gradient(farthest-corner_at_center_bottom,transparent_20%,theme(colors[white]/10%))] p-3 px-4 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default GlowCard;
