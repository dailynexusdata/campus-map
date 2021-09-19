import * as d3 from "d3";
import GetMap from "./getMapClass";

const getLatLng = (leaflet, [lng, lat]) => {
  const ll = new L.latLng(lat, lng);
  return leaflet.latLngToLayerPoint(ll);
};

const makePlot = (goldData, mapData) => {
  // const mapData = {
  //   type: "FeatureCollection",
  //   features: mapData1.features.filter(
  //     (d) =>
  //       !["Portola Dining Commons", "Santa Catalina"].includes(
  //         d.properties.name
  //       )
  //   ),
  // };

  const container = d3.select("#laby-campus-map-dorms-dining");
  container.selectAll("*").remove();

  const size = {
    height: 600,
    width: Math.min(600, window.innerWidth - 40),
  };

  const hoverArea = container
    .append("div")
    .style("position", "relative")
    .attr("id", "dormDiningLocationsHover")
    .style("width", size.width + "px");
  //34.4124594304945, lng: -119.85666846914685}
  const [map, svg] = new GetMap(
    "dormDiningLocationsHover",
    true,
    [34.4124594304945, -119.85486846914685],
    14.75,
    {
      zoomSnap: 0,
      zoomDelta: 1,
    }
  );

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

  // const path = d3.geoPath().projection(projection);

  const path = d3
    .line()
    .x((d) => getLatLng(map, d).x)
    .y((d) => getLatLng(map, d).y);

  const colors = d3.scaleSequential(d3.interpolateBlues);
  let image = svg.append("g").attr("pointer-events", "none").selectAll("image");

  const locations = svg.selectAll("buildings").data(mapData.features).join("g");

  // the current selected department is just the first one
  // const department = goldData[0];

  console.log(mapData);

  const catColor = {
    dining: "red",
    dorm: "blue",
  };

  const points = locations
    .filter((d) => d.geometry.coordinates.length > 1)
    .append("circle")
    .attr("cx", (d) => {
      return getLatLng(map, d.geometry.coordinates).x;
    })
    .attr("cy", (d) => getLatLng(map, d.geometry.coordinates).y)
    .attr("r", 3)
    .attr("fill", catColor["dining"]);

  const areas = locations
    .filter((d) => d.geometry.coordinates[0].length > 1)
    .append("path")
    .attr("d", (d) => {
      return path(d.geometry.coordinates[0]);
    })
    .attr("fill", (d) => {
      const isDining =
        d.properties.name.match(/Dining Commons/) ||
        [
          "University Center",
          "Coral Tree Cafe",
          "Arbor",
          "Tenaya Market",
        ].includes(d.properties.name);
      return catColor[isDining ? "dining" : "dorm"];
    })
    // .attr("fill-opacity", () => (Math.random() > 0.5 ? 0.3 : 1))
    .attr("id", (d) => d.properties.name);

  const updateMap = () => {
    areas.attr("d", (d) => {
      return path(d.geometry.coordinates[0]);
    });
    points
      .attr("cx", (d) => {
        return getLatLng(map, d.geometry.coordinates).x;
      })
      .attr("cy", (d) => getLatLng(map, d.geometry.coordinates).y);
  };

  map.on("moveend", () => {
    updateMap();
  });

  updateMap();

  const locs = [];

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
};

export default makePlot;
