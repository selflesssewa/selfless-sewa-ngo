import { twMerge } from "tailwind-merge";

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

const Container = ({ children, className }: Props) => {
  return (
    <div className={twMerge("mx-auto max-w-[1200px] px-3 md:px-8", className)}>
      {children}
    </div>
  );
};

export default Container;
