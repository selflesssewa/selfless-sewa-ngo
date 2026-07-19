"use client";

import { TLocation } from "@/types";
import Container from "./Container";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Annotation,
} from "react-simple-maps";

const geoUrl =
  "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json";

export default function Map({ points }: { points: Array<TLocation> }) {
  return (
    <ComposableMap
      className="max-h-[80vh] w-full"
      projection="geoMercator"
      height={1000}
      width={1000}
      projectionConfig={{
        rotate: [-80, -22, 0],
        scale: 1600,
      }}
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
      {points.map(({ label, lon, lat }, i) => (
        <Marker coordinates={[lon, lat]} key={label}>
          {/* expanding pulse ring — staggered phase so they don't blink in sync */}
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
          {/* glowing beacon: white halo dot with a small themed core */}
          <circle r={6} filter="url(#dotGlow)" className="fill-white" />
          <circle r={2.5} className="fill-blue" />
        </Marker>
      ))}
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
    </ComposableMap>
  );
}
