"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { twMerge } from "tailwind-merge";

const TestimonialSlider = ({ testimonials }: { testimonials: TTestimonial[] }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const wrapperRef = useRef<HTMLUListElement>(null);
  const slidesRef = useRef<HTMLLIElement[]>([]);
  const [contentLens, setContentLens] = useState<number[]>([]);
  const [isStopped, setIsStopped] = useState(true);
  const [trigger, setTrigger] = useState<"auto" | "swipe" | "tap">();
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
    if (nodes) {
      const lens = Array.from(nodes).map(el => Number(el.dataset.length ?? 350) * 8);
      setContentLens(lens);
    }

    const listNodes = wrapperRef.current?.querySelectorAll<HTMLLIElement>("li");
    if (listNodes) {
      slidesRef.current = Array.from(listNodes);
    }
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const scrollEndCallback = () => {
      setTrigger(undefined);
    };
    wrapperRef.current.addEventListener("scrollend", scrollEndCallback);

    if (trigger == "auto" || trigger == "tap") {
      const slide = slidesRef.current[activeSlideIndex];
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
    <div className="flex gap-4 flex-col">
      <div className="max-md:px-3">
        <h2 className="text-center text-balance max-md:mb-2 text-headline-md max-md:text-title-lg mb-3 tracking-normal">
          Hear From Our Sewaks
        </h2>
      </div>
      <div ref={ref} className="overflow-hidden">
        <ul
          ref={wrapperRef}
          className="relative md:testimonial-mask flex snap-x snap-mandatory max-md:gap-2 gap-3 overflow-x-scroll no-scrollbar"
          onScroll={ev => {
            ev.preventDefault();
            if (trigger == "auto" || trigger == "tap") return;
            setIsStopped(true);
            setTrigger("swipe");

            const idx = Array.from(ev.currentTarget.querySelectorAll("li")).findIndex(li => {
              const padding = 0;
              return (
                ev.currentTarget.scrollLeft + padding < li.offsetLeft + li.clientWidth / 2 &&
                li.offsetLeft + li.clientWidth / 2 <
                  ev.currentTarget.scrollLeft + ev.currentTarget.clientWidth - padding
              );
            });
            setActiveSlideIndex(idx);
          }}
        >
          {testimonials.map(({ content, name, role }, idx) => (
            <li
              key={idx}
              className="snap-center flex shrink-0 scroll-smooth items-stretch max-md:w-[90%]  w-[84%] max-w-prose first:ms-[50vw] last:me-[50vw]"
            >
              <div
                className={twMerge(
                  "p-1 rounded-[16px] bg-blue-30 duration-700 origin-center w-full backdrop-blur-xl",
                  activeSlideIndex == idx ? "scale-100" : "scale-90",
                  activeSlideIndex > idx && "origin-right",
                  idx > activeSlideIndex && "origin-left"
                )}
              >
                <div
                  className={twMerge(
                    "max-md:p-4 p-6 px-5 rounded-[12px] h-full",
                    activeSlideIndex == idx ? "bg-blue" : "bg-blue-30"
                  )}
                >
                  <p className="text-headline-sm mb-1">{name}</p>
                  <p className="mb-5 opacity-90">{role}</p>
                  {content}
                </div>
              </div>
            </li>
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
                "cursor-pointer overflow-hidden rounded-md duration-200 ease-in-out w-3 h-2 bg-blue-60",
                activeSlideIndex == idx && "bg-blue w-6"
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
