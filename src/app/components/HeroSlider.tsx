"use client";

import { THomePageContent } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { twMerge } from "tailwind-merge";

const HeroSlider = ({
  images,
}: {
  images: THomePageContent["sliderImgUrls"];
}) => {
  const [slider, { width }] = useMeasure();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setDuration(width / 70);
  }, [width]);

  return (
    <div className="md:masked max-w-full overflow-hidden">
      <div
        className={twMerge(
          "flex min-w-max animate-slider gap-[32px] max-md:gap-[16px]",
          width
            ? "[animation-play-state:running]"
            : "[animation-play-state:paused]",
        )}
        ref={slider}
        style={{ "--slider-duration": `${duration}s` } as React.CSSProperties}
      >
        {[...images, ...images].map((src, idx) => (
          <div
            key={idx}
            className="relative aspect-[7/10] h-[60vh] max-md:h-[50vh] max-sm:h-[45vh]"
          >
            <Image
              alt=""
              src={src}
              className="rounded-[16px] object-cover"
              fill
              priority
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
