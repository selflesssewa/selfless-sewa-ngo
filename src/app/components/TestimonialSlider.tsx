"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useInView } from "framer-motion";

const TestimonialSlider = ({ testimonials }: { testimonials: TTestimonial[] }) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const wrapperRef = useRef<HTMLUListElement>(null);
  const slidesRef = useRef<HTMLLIElement[]>([]);
  const [contentLengths, setContentLengths] = useState<number[]>([]);
  const [isStopped, setIsStopped] = useState(true);
  const [trigger, setTrigger] = useState<"auto" | "swipe" | "tap">();
  const slideTimeoutId = useRef<NodeJS.Timeout>();
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sliderContainerRef, { once: true, margin: "0% 0% -50% 0%" });

  const stopAnimation = () => {
    setIsStopped(true);
    clearTimeout(slideTimeoutId.current);
  };

  function scrollToSlide(id: number) {
    const slide = slidesRef.current[id];
    if (!slide) return;
    wrapperRef.current?.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    });
    setTrigger("auto");
  }

  useEffect(() => {
    if (inView) {
      setIsStopped(false);
    }
  }, [inView]);

  useEffect(() => {
    const nodes = wrapperRef.current?.querySelectorAll<HTMLParagraphElement>("[data-length]");
    if (nodes) {
      const contentLengths = Array.from(nodes).map(el => Number(el.dataset.length ?? 350) * 15);
      setContentLengths(contentLengths);
    }

    const listNodes = wrapperRef.current?.querySelectorAll<HTMLLIElement>("li");
    if (listNodes) {
      slidesRef.current = Array.from(listNodes);
    }
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    wrapperRef.current.addEventListener("scrollend", () => {
      setTrigger(undefined);
    });

    if (!isStopped) {
      const timeSecs = contentLengths[activeSlideIndex];
      slideTimeoutId.current = setTimeout(() => {
        const nextIdx = (activeSlideIndex + 1) % testimonials.length;
        scrollToSlide(nextIdx);
        setActiveSlideIndex(nextIdx);
      }, timeSecs);
    }

    return () => {
      clearTimeout(slideTimeoutId.current);
    };
  }, [activeSlideIndex, isStopped, trigger, contentLengths, testimonials.length]);

  return (
    <div className="flex gap-4 flex-col">
      <div className="max-md:px-3">
        <h2 className="text-center text-balance max-md:mb-2 text-headline-sm max-md:text-title-md mb-3 tracking-normal">
          Hear From Our सेवकs
        </h2>
      </div>
      <div ref={sliderContainerRef}>
        <ul
          ref={wrapperRef}
          className="no-scrollbar overflow-x-scroll relative md:testimonial-mask flex snap-x snap-mandatory max-md:gap-2 gap-3 pb-6 -mb-6"
          onScroll={ev => {
            ev.preventDefault();
            if (trigger == "auto" || trigger == "tap") return;
            setIsStopped(true);
            setTrigger("swipe");

            const idx = Array.from(ev.currentTarget.querySelectorAll("li")).findIndex(li => {
              const padding = 40;
              return (
                li.offsetLeft + li.clientWidth / 2 - padding > ev.currentTarget.scrollLeft &&
                li.offsetLeft + li.clientWidth / 2 - padding <
                  ev.currentTarget.scrollLeft + ev.currentTarget.clientWidth
              );
            });
            setActiveSlideIndex(idx);
          }}
        >
          {testimonials.map(({ content, name, role }, idx) => (
            <li
              key={idx}
              className="snap-center snap-always flex shrink-0 items-stretch max-md:w-[90%] w-[84%] max-w-prose first:ms-[30vw] last:me-[30vw]"
            >
              <div
                className={twMerge(
                  "bg-[radial-gradient(farthest-corner_at_center_top,theme(colors[blue]/30%),theme(colors[blue]/90%))] rounded-[16px] shadow-xl gap-5 max-md:p-4 p-5 flex flex-col duration-300 origin-center backdrop-blur-xl shadow-blue-30",
                  activeSlideIndex == idx ? "scale-100  opacity-100" : "scale-90 opacity-60",
                  activeSlideIndex > idx && "origin-right",
                  idx > activeSlideIndex && "origin-left"
                )}
              >
                {content}
                <div className="mt-auto">
                  <p className="text-title-lg">{name}</p>
                  <p className="opacity-90">{role}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-center mt-6 items-center">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTrigger("tap");
                stopAnimation();
                scrollToSlide(idx);
                setActiveSlideIndex(idx);
              }}
              className="cursor-pointer z-10 py-2 duration-200 -my-2 group px-1"
            >
              <div
                className={twMerge(
                  "rounded-[2px] duration-200 ease-in-out w-[1.2rem] h-1 bg-blue-60  overflow-hidden group-hover:ring-1 ring-blue-60",
                  activeSlideIndex == idx && "bg-blue w-6"
                )}
              >
                <div
                  className={twMerge(
                    "h-full w-full scale-0 origin-left bg-white",
                    activeSlideIndex == idx && !isStopped && "animate-progress"
                  )}
                  style={{ "--progress-duration": `${contentLengths[activeSlideIndex]}ms` } as CSSProperties}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialSlider;
