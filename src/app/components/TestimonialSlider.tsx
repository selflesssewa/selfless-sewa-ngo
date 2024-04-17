"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { InView, useInView } from "react-intersection-observer";
import { twMerge } from "tailwind-merge";

const TestimonialSlider = ({ testimonials }: { testimonials: TTestimonial[] }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const wrapperRef = useRef<HTMLUListElement>(null);
  const [contentLens, setContentLens] = useState<number[]>([]);
  const [isStopped, setIsStopped] = useState(true);
  const [trigger, setTrigger] = useState<"auto" | "swipe" | "tap">();
  const [isScrolling, setIsScrolling] = useState(false);
  const slideTimeoutId = useRef<NodeJS.Timeout>();
  const { ref, inView } = useInView({ triggerOnce: true });

  const stopAnimation = () => {
    setIsStopped(true);
    clearTimeout(slideTimeoutId.current);
  };

  useEffect(() => {
    if (inView) {
      setTrigger("auto");
      setIsStopped(false);
    }
  }, [inView]);

  useEffect(() => {
    const nodes = wrapperRef.current?.querySelectorAll<HTMLParagraphElement>("[data-length]");

    if (nodes == undefined) return;
    const lens = Array.from(nodes).map(el => Number(el.dataset.length ?? 350) * 4);
    setContentLens(lens);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const scrollEndCallback = () => {
      setTrigger(undefined);
      setIsScrolling(false);
    };
    wrapperRef.current.addEventListener("scrollend", scrollEndCallback);

    if (trigger == "auto" || trigger == "tap") {
      const slide = wrapperRef.current.querySelector<HTMLLIElement>(`li:nth-of-type(${activeSlideIndex + 1})`);

      if (!slide) return;
      wrapperRef.current.scrollTo({
        left: slide.offsetLeft,
        behavior: "smooth",
      });
    }

    if (!isStopped) {
      const time = contentLens[activeSlideIndex];
      slideTimeoutId.current = setTimeout(() => {
        setTrigger("auto");
        setActiveSlideIndex((activeSlideIndex + 1) % testimonials.length);
      }, time);
    }

    return () => {
      clearTimeout(slideTimeoutId.current);
      wrapperRef.current?.removeEventListener("scrollend", scrollEndCallback);
    };
  }, [activeSlideIndex, isStopped, trigger]);

  return (
    <div className="flex gap-4 max-md:flex-col items-baseline">
      <div className="max-md:px-3 md:basis-2/5">
        <h2 className="max-md:text-center text-balance max-md:mb-6 text-headline-md max-md:text-title-lg mb-3 tracking-normal">
          Hear From Our Sewaks
        </h2>
        <button onClick={() => setIsStopped(false)}>Play</button>
      </div>
      <div ref={ref} className="md:basis-3/5 overflow-hidden">
        <ul
          ref={wrapperRef}
          className="relative md:testimonial-mask flex snap-x snap-mandatory max-md:gap-2 gap-3 overflow-x-scroll no-scrollbar"
        >
          {testimonials.map(({ content, name, role }, idx) => (
            <InView
              rootMargin="4000px 0px 4000px 0px"
              threshold={0.8}
              onChange={inView => {
                if (inView && trigger == undefined) {
                  setTrigger("swipe");
                  setIsScrolling(true);
                  stopAnimation();
                  setActiveSlideIndex(idx);
                }
              }}
              as="li"
              key={idx}
              className="snap-center flex shrink-0 scroll-smooth items-stretch max-md:w-[90%] max-md:first:ms-[5%] max-md:last:me-[5%] w-[84%] first:ms-[8%] last:me-[8%]"
            >
              <div
                className={twMerge(
                  "p-1 rounded-[12px] bg-blue-30 duration-700 origin-center w-full backdrop-blur-xl",
                  activeSlideIndex == idx ? "scale-100" : "scale-90",
                  activeSlideIndex > idx && "origin-right",
                  idx > activeSlideIndex && "origin-left"
                )}
              >
                <div
                  className={twMerge(
                    "max-md:p-4 p-6 px-5 rounded-[8px] h-full",
                    activeSlideIndex == idx ? "bg-blue" : "bg-blue-30"
                  )}
                >
                  <p className="text-headline-sm mb-1">{name}</p>
                  <p className="mb-5 text-body-lg">{role}</p>
                  {content}
                </div>
              </div>
            </InView>
          ))}
        </ul>
        <div className="flex gap-2 justify-center mt-4 p-1">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTrigger("tap");
                stopAnimation();
                setActiveSlideIndex(idx);
              }}
              className={twMerge(
                "cursor-pointer overflow-hidden rounded-md duration-200 ease-in-out w-4 h-2 bg-blue-60",
                activeSlideIndex == idx && "bg-blue w-8"
              )}
            >
              <div
                className={twMerge(
                  "h-full w-full scale-0 origin-left bg-white",
                  activeSlideIndex == idx && !isStopped && "animate-progress"
                )}
                style={{ "--progress-duration": `${contentLens[activeSlideIndex]}ms` } as CSSProperties}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;
