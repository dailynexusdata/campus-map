import * as d3 from "d3";
import { polygon } from "leaflet";
import GetMap from "./getMapClass";

// https://i.pinimg.com/originals/cb/22/c6/cb22c6dd0d7d3eec12826c5c7af210d3.jpg
const parkingDesignations = {
  "Lot 1": ["S", "R", "A"],
  "Lot 2": ["B1"], // M ?
  "Lot 3": ["S", "A", "M"],
  "Lot 4": ["S", "A"],
  "Lot 5": ["S", "A", "M", "Meter"], // coastal
  "Lot 6": ["S", "A", "Meter"], // coastal
  "Lot 8": ["V", "Meter"],
  "Lot 9": ["S", "A"],
  "Lot 10": ["S", "A", "Meter", "M"], // coastal
  "Lot 11": ["S", "A", "M"],
  "Lot 12": ["S", "A", "R", "Meter"],
  "Lot 14": ["S", "A", "R"],
  "Lot 16": ["C", "S", "A"],
  "Lot 18": ["C", "S", "A", "M"],
  "Lot 19": ["S", "A"],
  "Lot 22": ["C", "S", "A", "22B"],
  "Lot 23": ["C", "S", "A", "M"],
  "Lot 24": ["S", "A", "Meter"],
  "Lot 27": ["C", "S", "A", "M"],
  "Lot 29": ["S", "A", "R", "M"],
};

const codesMap = {
  S: ["Staff"],
  C: ["Students", "Commuters", "Visitors"],
  A: ["Faculty"],
  M: ["Motorcycles"],
  Meter: { vals: ["Parking Meters"], cat: "General Public" },
  R: ["Reserved"],
  "22B": { vals: ["Residential Students"], cat: "Students" },
  V: ["Vendor"],
  B1: { vals: ["Residential Students"], cat: "Students" },
};

const getLatLng = (leaflet, [lng, lat]) => {
  const ll = new L.latLng(lat, lng);
  return leaflet.latLngToLayerPoint(ll);
};

const getLatLngObj = (leaflet, { lng, lat }) => {
  const ll = new L.latLng(lng, lat);
  return leaflet.latLngToLayerPoint(ll);
};

const makePlot = (goldData, mapData) => {
  const container = d3.select("#laby-campus-map-parking-lots");
  container.selectAll("*").remove();

  const size = {
    height: 600,
    width: Math.min(600, window.innerWidth - 40),
  };

  const options = ["Students", "Faculty", "Motorcycles", "General Public"];

  const buttonBar = container
    .append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("flex-wrap", "wrap")
    .style("width", size.width + "px")
    .style("margin", "10px 0");

  const locs = [];

  const buttons = buttonBar
    .selectAll("button")
    .data(options)
    .enter()
    .append("button")
    .style("background-color", "white")
    .text((d) => d)
    .style("border", "2px solid black")
    .style("border-radius", "5px")
    .style("margin", "5px")
    .style("padding", "5px 10px")
    .style("font-size", "12pt")
    .style("cursor", "pointer");

  const hoverArea = container
    .append("div")
    .style("position", "relative")
    .attr("id", "parkingLocationsHover")
    .style("width", size.width + "px");

  const [map, svg] = new GetMap("parkingLocationsHover");

  svg.attr("pointer-events", "visible").style("pointer-events", "visible");

  d3.select(map.getPanes().overlayPane).attr("pointer-events", "auto");

  // Setup the projection and then translate a lil bit so its not cut off
  // const proj = d3
  //   .geoMercator()
  //   .fitSize([size.width - 50, size.height], mapData);

  // const projection = d3
  //   .geoMercator()
  //   .scale(proj.scale())
  //   .translate([proj.translate()[0] + 25, proj.translate()[1]]);

  // const map = d3.geoPath().projection(projection);

  const path = d3
    .line()
    .x((d) => getLatLng(map, d).x)
    .y((d) => getLatLng(map, d).y);

  const colors = d3.scaleSequential(d3.interpolateBlues);

  // the current selected department is just the first one
  // const department = goldData[0];

  // .attr("id", (d) => d.properties.name);

  // const locations = svg
  //   .selectAll(".parkingLots")
  //   .data(mapData.features)
  //   .enter()
  //   .append("g")
  //   .attr("class", "parkingLots");

  const areas = svg
    .selectAll(".parkingLots")
    .data(mapData.features)
    .enter()
    .append("path")
    .attr("class", "parkingLots")
    .attr("d", (d) => {
      return path(d.geometry.coordinates[0]);
    })
    .attr("fill", "#4DD080")
    .attr("fill-opacity", 0.3);

  // console.log(mapData.features);

  const text = svg
    .selectAll(".parkingLotsText")
    .data(mapData.features.filter((_, i) => i !== 3 && i !== 11))
    .enter()
    .append("text")
    .attr("class", "parkingLotsText")
    .text((d) => d.properties.name)
    .attr("text-anchor", "middle")
    .attr("baseline-alignment", "center")
    .attr("x", (d) => {
      return getLatLngObj(
        map,
        polygon(d.geometry.coordinates).getBounds().getCenter()
      ).x;
    })
    .attr("y", (d) => {
      return getLatLngObj(
        map,
        polygon(d.geometry.coordinates).getBounds().getCenter()
      ).y;
    });

  const updateMap = () => {
    areas.attr("d", (d) => {
      return path(d.geometry.coordinates[0]);
    });

    text
      .attr("x", (d) => {
        return getLatLngObj(
          map,
          polygon(d.geometry.coordinates).getBounds().getCenter()
        ).x;
      })
      .attr("y", (d) => {
        return getLatLngObj(
          map,
          polygon(d.geometry.coordinates).getBounds().getCenter()
        ).y;
      });
  };

  map.on("moveend", () => {
    updateMap();
  });

  updateMap();

  buttons.on("click", (_, d) => {
    if (locs.includes(d)) {
      locs.splice(locs.indexOf(d), 1);
    } else {
      locs.push(d);
    }
    map.setView([34.411937314426886, -119.84639883041383], 15.4);
    buttons.style("background-color", (d) => {
      return locs.includes(d) ? "#d3d3d388" : "white";
    });

    if (locs.length === 0) {
      areas.attr("fill-opacity", 0.3);
    } else
      areas.attr("fill-opacity", (d) => {
        const lot = parkingDesignations[d.properties.name[0]];
        const codes = lot
          .map((d) => {
            const cm = codesMap[d];
            if (Object.keys(cm).includes("cat")) {
              return [cm.cat];
            }
            return cm;
          })
          .reduce((a, b) => [...a, ...b]);
        return locs.reduce(
          (acc, curr) =>
            acc &&
            (curr === "General Public"
              ? codes.includes(curr) || codes.includes("Visitors")
              : codes.includes(curr)),
          true
        )
          ? 0.3
          : 0;
      });

    text.attr("fill-opacity", (d) => {
      const lot = parkingDesignations[d.properties.name[0]];
      const codes = lot
        .map((d) => {
          const cm = codesMap[d];
          if (Object.keys(cm).includes("cat")) {
            return [cm.cat];
          }
          return cm;
        })
        .reduce((a, b) => [...a, ...b]);
      return locs.reduce(
        (acc, curr) =>
          acc &&
          (curr === "General Public"
            ? codes.includes(curr) || codes.includes("Visitors")
            : codes.includes(curr)),
        true
      )
        ? 1
        : 0;
    });
  });

  // const labels = locations
  //   .append("text")
  //   .attr("x", (d) => path.centroid(d)[0])
  //   .attr("y", (d) => {
  //     const base = path.centroid(d)[1];
  //     const num = +d.properties.name[0].split(" ")[1];
  //     if (num === 4 || num === 19 || num === 8) {
  //       return base - 10;
  //     }
  //     return base;
  //   })
  //   .attr("text-anchor", "middle")
  //   .attr("alignment-baseline", "middle")
  //   .attr("fill", "black")
  //   .attr("stroke-width", 0.5)
  //   .style("font-size", "12pt")
  //   .style("font-weight", "bold")
  //   .text((d, i) => {
  //     const n = d.properties.name[0];
  //     if (!locs.includes(n)) {
  //       locs.push(n);
  //       return n;
  //     }
  //   });

  // areas.raise();
  // labels.raise();
};

export default makePlot;
