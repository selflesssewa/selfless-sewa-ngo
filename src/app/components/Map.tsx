"use client";

import Container from "./Container";
import { ComposableMap, Geographies, Geography, Marker, Annotation } from "react-simple-maps";

const geoUrl = "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json";

export default function Map({ points }: { points: TLocation[] }) {
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
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              className="fill-blue-30 stroke-blue-60 backdrop-blur-xl stroke-[0.035rem] pointer-events-none"
              key={geo.rsmKey}
              geography={geo}
            />
          ))
        }
      </Geographies>
      {points.map(({ label, lon, lat }) => (
        <Marker coordinates={[lon, lat]} key={label}>
          <circle r={5} className="fill-transparent stroke-white max-md:stroke-2 stroke-1" />
        </Marker>
      ))}
      {points.map(p => (
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
            className="fill-white text-title-lg font-medium tracking-wider"
          >
            {p.label}
          </text>
        </Annotation>
      ))}
    </ComposableMap>
  );
}
