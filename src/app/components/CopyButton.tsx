"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { twMerge } from "tailwind-merge";

export default function CopyButton({ value }: { value: string }) {
  const [tapped, setTapped] = useState(false);
  const id = useRef<NodeJS.Timeout>();

  function handleClick() {
    navigator.clipboard.writeText(value);
    setTapped(true);
  }

  useEffect(() => {
    if (tapped) {
      id.current = setTimeout(() => setTapped(false), 2000);
    }

    return () => {
      if (id.current) clearTimeout(id.current);
    };
  }, [tapped]);

  return (
    <button
      className={twMerge(
        "relative -m-0 flex items-center p-0",
        tapped && "pointer-events-none",
      )}
      onClick={handleClick}
      title="copy"
    >
      <MaterialSymbol
        icon={tapped ? "check_circle" : "copy_all"}
        weight={300}
        size={20}
      />
      {tapped && (
        <span className="absolute bottom-full left-1/2 mb-0 -translate-x-1/2 rounded-[4px] bg-blue-60 p-0 px-2 text-body-md tracking-widest shadow-md shadow-blue-30">
          copied
        </span>
      )}
    </button>
  );
}
