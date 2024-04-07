"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { twMerge } from "tailwind-merge";

const images: string[] = Array.from<string>({ length: 4 }).fill("/images/IMG_1118.jpeg");

const HeroSlider = () => {
  const [slider, { width }] = useMeasure();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setDuration(width / 200);
  }, [width]);

  return (
    <div className="max-w-full overflow-hidden md:masked">
      <div
        className={twMerge(
          "flex gap-[16px] min-w-max animate-slider",
          width ? "[animation-play-state:running]" : "[animation-play-state:paused]"
        )}
        ref={slider}
        style={{ "--slider-duration": `${duration}s` } as React.CSSProperties}
      >
        {[...images, ...images].map((src, idx) => (
          <div key={idx} className="relative max-sm:h-[45vh] max-md:h-[50vh] h-[60vh] aspect-[4/5] backdrop-blur-lg">
            <Image alt="" src={src} className="rounded-[8px] object-cover" fill priority />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
