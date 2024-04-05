import Image from "next/image";

const HeroSlider = () => {
  return (
    <div className="h-[60vh] flex overflow-x-scroll gap-4 no-scrollbar ">
      {Array.from({ length: 12 }).map((_, idx) => (
        <div
          key={idx}
          className="relative h-full shrink-0 aspect-[4/5] rounded-[16px] border-blue/15 border-[8px] backdrop-blur-md"
        >
          <Image alt="" src="/images/IMG_1118.jpeg" className="rounded-[8px] object-cover" fill priority />
        </div>
      ))}
    </div>
  );
};

export default HeroSlider;
