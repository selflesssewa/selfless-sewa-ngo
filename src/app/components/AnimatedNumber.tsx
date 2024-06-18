"use client";

import { animate, useInView } from "framer-motion";
import { createElement, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  to: number;
  from?: number;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};

export const AnimatedNumber = ({ as, className, to, from = 0 }: Props) => {
  const elRef = useRef<HTMLElement>(null);
  const inView = useInView(elRef, { once: true, margin: "0% 0% -10% 0%" });

  const min = 1,
    max = 2;

  useEffect(() => {
    if (!inView) return;

    const controls = animate(from, to, {
      duration: Math.random() * (max - min) + min,
      ease: "linear",
      onComplete() {
        if (elRef.current) elRef.current.dataset["done"] = "true";
      },
      onUpdate(latest) {
        if (elRef.current)
          elRef.current.textContent = String(latest.toFixed()).padStart(
            String(to).length,
            "0",
          );
      },
    });

    return () => controls.cancel();
  }, [from, to, inView]);

  return createElement(
    as ?? "span",
    {
      className: twMerge(className),
      ref: elRef,
    },
    String(from).padStart(String(to).length, "0"),
  );
};
