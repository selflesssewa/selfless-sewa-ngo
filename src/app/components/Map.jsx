"use client"

import Container from "./Container";
import { ComposableMap, Geographies, Geography, Marker, Annotation } from "react-simple-maps"

const geoUrl = 'https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json'

const points = [
    { name: 'Delhi', cord: [28.684206305014524, 77.22257395612485], offset: -15 },
    { name: 'Gurugram', cord: [28.459418620083476, 77.02687713661878], offset: 15 },
    { name: 'Chandigarh', cord: [30.73473207793613, 76.78548668280196], offset: -15 },
];

export default function Map() {
    return (
        <Container className="my-8">
            <h2 className="tracking-wider text-center mb-5">Our Areas</h2>
            <ComposableMap
                className="max-h-[80vh] w-full"
                projection="geoMercator"
                height={1000}
                width={1000}
                projectionConfig={{
                    rotate: [-82, -22, 0],
                    scale: 1600
                }}>
                <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                className="fill-blue-60 stroke-blue-60 stroke-[0.05rem] pointer-events-none"
                                key={geo.rsmKey} geography={geo}
                            />
                        ))
                    }
                </Geographies>
                {
                    points.map(({ cord, name, offset }) => (
                        <Marker coordinates={[cord[1], cord[0]]} key={name} >
                            <circle r={5} className="fill-transparent stroke-white max-md:stroke-2 stroke-1" />
                        </Marker>
                    ))
                }
                {points.map(p => (
                    <Annotation
                        key={p.name}
                        subject={[p.cord[1], p.cord[0]]}
                        dx={80}
                        dy={p.offset}
                        className="fill-white [&_path]:stroke-white [&_path]:stroke-1 max-md:[&_path]:stroke-2"
                        connectorProps={{ strokeLinecap: 'round' }}
                    >
                        <text textAnchor="start" alignmentBaseline="middle" x={8} className="fill-white max-md:text-title-lg font-medium tracking-wider">
                            {p.name}
                        </text>
                    </Annotation>
                ))}
            </ComposableMap>
        </Container>
    )
}