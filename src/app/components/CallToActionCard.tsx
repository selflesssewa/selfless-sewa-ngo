import Image from "next/image";

type Props = {
  title: string;
  body: string;
  imgSrc: string;
  imgAltText: string;
  footer: React.ReactNode;
};

const CallToActionCard = ({ title, body, imgSrc, imgAltText, footer }: Props) => {
  return (
    <div className="grid auto-cols-fr lg:grid-cols-2 gap-2 bg-blue-30 backdrop-blur-xl p-2 rounded-[16px]">
      <div className="bg-white-70 flex flex-col p-5 rounded-[8px]">
        <h2 className="text-balance text-black text-headline-sm mb-3 tracking-normal">{title}</h2>
        <p className="text-black text-pretty">{body}</p>
        {footer}
      </div>
      <div className="relative rounded-[8px] overflow-clip max-lg:aspect-[4/3] max-lg:-order-1">
        <Image src={imgSrc} alt={imgAltText} fill className="object-cover" />
      </div>
    </div>
  );
};

export default CallToActionCard;
