"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { twMerge } from "tailwind-merge";

const HeroSlider = ({ images }: { images: THomeContent["sliderImgUrls"] }) => {
  const [slider, { width }] = useMeasure();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setDuration(width / 200);
  }, [width]);

  return (
    <div className="max-w-full overflow-hidden md:masked">
      <div
        className={twMerge(
          "flex max-md:gap-[16px] gap-[32px] min-w-max animate-slider",
          width ? "[animation-play-state:running]" : "[animation-play-state:paused]"
        )}
        ref={slider}
        style={{ "--slider-duration": `${duration}s` } as React.CSSProperties}
      >
        {[...images, ...images].map((src, idx) => (
          <div key={idx} className="relative max-sm:h-[45vh] max-md:h-[50vh] h-[60vh] aspect-[7/10]">
            <Image alt="" src={src} className="rounded-[16px] object-cover" fill priority />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
