"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useInView } from "framer-motion";
import { TTestimonial } from "@/types";

const TestimonialSlider = ({
  testimonials,
}: {
  testimonials: Array<TTestimonial>;
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const wrapperRef = useRef<HTMLUListElement>(null);
  const slidesRef = useRef<HTMLLIElement[]>([]);
  const [contentLengths, setContentLengths] = useState<number[]>([]);
  const [isStopped, setIsStopped] = useState(true);
  const [trigger, setTrigger] = useState<"auto" | "swipe" | "tap">();
  const slideTimeoutId = useRef<NodeJS.Timeout>();
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sliderContainerRef, {
    once: true,
    margin: "0% 0% -50% 0%",
  });

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
    const nodes =
      wrapperRef.current?.querySelectorAll<HTMLParagraphElement>(
        "[data-length]",
      );
    if (nodes) {
      const contentLengths = Array.from(nodes).map(
        (el) => Number(el.dataset.length ?? 350) * 25,
      );
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
  }, [
    activeSlideIndex,
    isStopped,
    trigger,
    contentLengths,
    testimonials.length,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="max-md:px-3">
        <h2 className="mb-3 text-balance text-center text-headline-sm tracking-normal max-md:mb-2 max-md:text-title-md">
          Hear From Our सेवकs
        </h2>
      </div>
      <div ref={sliderContainerRef}>
        <ul
          ref={wrapperRef}
          className="no-scrollbar md:testimonial-mask relative -mb-6 flex snap-x snap-mandatory gap-3 overflow-x-scroll pb-6 max-md:gap-2"
          onScroll={(ev) => {
            ev.preventDefault();
            if (trigger == "auto" || trigger == "tap") return;
            setIsStopped(true);
            setTrigger("swipe");

            const idx = Array.from(
              ev.currentTarget.querySelectorAll("li"),
            ).findIndex((li) => {
              const padding = 40;
              return (
                li.offsetLeft + li.clientWidth / 2 - padding >
                  ev.currentTarget.scrollLeft &&
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
              className="flex w-[84%] max-w-prose shrink-0 snap-center snap-always items-stretch first:ms-[30vw] last:me-[30vw] max-md:w-[90%]"
            >
              <div
                className={twMerge(
                  "flex origin-center flex-col gap-5 rounded-[16px] bg-[radial-gradient(farthest-corner_at_center_top,theme(colors[blue]/30%),theme(colors[blue]/90%))] p-5 shadow-xl shadow-blue-30 backdrop-blur-xl duration-300 max-md:p-4",
                  activeSlideIndex == idx
                    ? "scale-100 opacity-100"
                    : "scale-90 opacity-60",
                  activeSlideIndex > idx && "origin-right",
                  idx > activeSlideIndex && "origin-left",
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
        <div className="mt-6 flex items-center justify-center">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTrigger("tap");
                stopAnimation();
                scrollToSlide(idx);
                setActiveSlideIndex(idx);
              }}
              className="group z-10 -my-2 cursor-pointer px-1 py-2 duration-200"
            >
              <div
                className={twMerge(
                  "h-1 w-[1.2rem] overflow-hidden rounded-[2px] bg-blue-60 ring-blue-60 duration-200 ease-in-out group-hover:ring-1",
                  activeSlideIndex == idx && "w-6 bg-blue",
                )}
              >
                <div
                  className={twMerge(
                    "h-full w-full origin-left scale-0 bg-white",
                    activeSlideIndex == idx && !isStopped && "animate-progress",
                  )}
                  style={
                    {
                      "--progress-duration": `${contentLengths[activeSlideIndex]}ms`,
                    } as CSSProperties
                  }
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
