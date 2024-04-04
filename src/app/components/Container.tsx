import { twMerge } from "tailwind-merge";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

const Container = ({ children, className }: Props) => {
  return <div className={twMerge("px-3 max-w-[1200px] mx-auto", className)}>{children}</div>;
};

export default Container;
