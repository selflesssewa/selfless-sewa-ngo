import { twMerge } from "tailwind-merge";

const GlowCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={twMerge(
        "rounded-[8px] border-white/10 border bg-[radial-gradient(farthest-corner_at_center_bottom,transparent_20%,theme(colors[white]/10%))] backdrop-blur text-pretty p-3 px-4",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlowCard;
