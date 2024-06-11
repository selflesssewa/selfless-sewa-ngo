import Image from "next/image";
import GlowCard from "./GlowCard";

type Props = {
  title: string;
  body: string;
  imgSrc: string;
  imgAltText: string;
  footer: React.ReactNode;
};

const CallToActionCard = ({
  title,
  body,
  imgSrc,
  imgAltText,
  footer,
}: Props) => {
  return (
    <div className="grid auto-cols-fr gap-2 rounded-[16px] bg-blue-30 p-2 backdrop-blur-xl lg:grid-cols-2">
      <div className="flex flex-col rounded-[8px] bg-white-70 px-3 py-4 md:p-5">
        <h2 className="mb-3 text-pretty text-headline-sm tracking-normal text-black">
          {title}
        </h2>
        <p className="text-pretty text-black">{body}</p>
        {footer}
      </div>
      <div className="relative overflow-clip rounded-[8px] max-lg:-order-1 max-lg:aspect-[4/3]">
        <Image
          src={imgSrc}
          alt={imgAltText}
          fill
          className="object-cover"
          sizes="700x800"
        />
      </div>
    </div>
  );
};

export default CallToActionCard;
