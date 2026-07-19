"use client";

import { TLocation } from "@/types";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation,
} from "react-simple-maps";
import { geoMercator } from "d3-geo";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const geoUrl =
  "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json";

// Mirror ComposableMap's projection so our arc paths line up with the beacons.
const projection = geoMercator()
  .rotate([-80, -22, 0])
  .scale(1600)
  .translate([500, 500]);

const project = (lon: number, lat: number): [number, number] => {
  const p = projection([lon, lat]);
  return p ? [p[0], p[1]] : [0, 0];
};

// Gentle curved (quadratic) path between two projected points.
function arcPath(a: [number, number], b: [number, number]): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dist = Math.hypot(dx, dy) || 1;
  const curve = Math.min(dist * 0.35, 90);
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = (a[0] + b[0]) / 2 + nx * curve;
  const cy = (a[1] + b[1]) / 2 + ny * curve;
  return `M ${a[0]} ${a[1]} Q ${cx} ${cy} ${b[0]} ${b[1]}`;
}

export default function Map({ points }: { points: Array<TLocation> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  // Draw the "reach" arcs from our HQ (Delhi) out to every other city.
  const hq = points.find((p) => p.label.toLowerCase() === "delhi") ?? points[0];
  const hqXY = hq ? project(hq.lon, hq.lat) : ([0, 0] as [number, number]);
  const spokes = points
    .filter((p) => p !== hq)
    .map((p, i) => ({ p, i, d: arcPath(hqXY, project(p.lon, p.lat)) }));

  return (
    <div ref={ref}>
      <ComposableMap
        className="max-h-[80vh] w-full"
        projection="geoMercator"
        height={1000}
        width={1000}
        projectionConfig={{ rotate: [-80, -22, 0], scale: 1600 }}
      >
        <defs>
          <filter id="dotGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="labelShadow" x="-20%" y="-40%" width="140%" height="180%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="2"
              floodColor="#0b1b3a"
              floodOpacity="0.55"
            />
          </filter>
        </defs>

        {/* Country fades in when the map scrolls into view */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9 }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  tabIndex={-1}
                  className="pointer-events-none fill-blue-30 stroke-blue stroke-[0.035rem]"
                  key={geo.rsmKey}
                  geography={geo}
                />
              ))
            }
          </Geographies>
        </motion.g>

        {/* Reach arcs: draw themselves from HQ to each city, with a light travelling along */}
        {spokes.map(({ p, i, d }) => (
          <g key={`arc-${p.label}`}>
            <motion.path
              d={d}
              fill="none"
              strokeLinecap="round"
              strokeWidth={1.1}
              className="stroke-white/60"
              filter="url(#dotGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{
                duration: 1.1,
                delay: 0.7 + i * 0.12,
                ease: "easeInOut",
              }}
            />
            <motion.g
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1.7 + i * 0.12, duration: 0.4 }}
            >
              <circle r={2.6} className="fill-white" filter="url(#dotGlow)">
                <animateMotion
                  path={d}
                  dur="3s"
                  begin={`${1.7 + i * 0.12}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </motion.g>
          </g>
        ))}

        {/* City beacons: pop in one-by-one, then pulse forever */}
        {points.map((p, i) => (
          <Marker coordinates={[p.lon, p.lat]} key={p.label}>
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{
                delay: 0.2 + i * 0.1,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
            >
              {/* expanding pulse ring */}
              <circle r={4} className="fill-white">
                <animate
                  attributeName="r"
                  values="4;22"
                  dur="2.6s"
                  begin={`-${i * 0.4}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.4;0"
                  dur="2.6s"
                  begin={`-${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* glowing beacon */}
              <circle r={6} filter="url(#dotGlow)" className="fill-white" />
              <circle r={2.5} className="fill-blue" />
            </motion.g>
          </Marker>
        ))}

        {/* Labels fade in together */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          {points.map((p) => (
            <Annotation
              key={p.label}
              subject={[p.lon, p.lat]}
              dx={p.offsetX}
              dy={p.offsetY}
              className="fill-white [&_path]:stroke-white [&_path]:stroke-1 max-md:[&_path]:stroke-2"
              connectorProps={{ strokeLinecap: "round" }}
            >
              <text
                textAnchor={p.offsetX > 0 ? "start" : "end"}
                alignmentBaseline="middle"
                x={p.offsetX > 0 ? 8 : -8}
                filter="url(#labelShadow)"
                className="fill-white text-title-lg font-medium tracking-wider"
              >
                {p.label}
              </text>
            </Annotation>
          ))}
        </motion.g>
      </ComposableMap>
    </div>
  );
}
