import * as d3 from "d3";
import { polygon } from "leaflet";
import GetMap from "./getMapClass";

const getLatLng = (leaflet, [lng, lat]) => {
  const ll = new L.latLng(lat, lng);
  return leaflet.latLngToLayerPoint(ll);
};
const getLatLngObj = (leaflet, { lng, lat }) => {
  const ll = new L.latLng(lng, lat);
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

  container.attr("height", size.height).attr("width", size.width);

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

  const tooltip = hoverArea
    .append("div")
    .style("display", "none")
    .style("pointer-events", "none")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "10px")
    .style("border-radius", "10px")
    .style("border", "1px solid #d3d3d3");

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

  // console.log(mapData);

  const catColor = {
    dining: "blue",
    food: "green",
    // dorm: "blue",

    dorm: "none",
  };

  const points = locations
    .filter((d) => d.geometry.coordinates.length > 1)
    .append("circle")
    .attr("cx", (d) => {
      return getLatLng(map, d.geometry.coordinates).x;
    })
    .attr("cy", (d) => getLatLng(map, d.geometry.coordinates).y)
    .attr("r", 3)
    .attr("fill", catColor["food"]);

  // const labels = locations
  //   .append("text")
  //   .attr("class", "diningLocationsText")
  //   .text((d) => {
  //     // console.log(d.geometry.coordinates, d.geometry.coordinates[0].length);
  //     return d.properties.name;
  //   })
  //   .attr("text-anchor", "middle")
  //   .attr("baseline-alignment", "center")
  //   .attr("x", (d) => {
  //     console.log(
  //       getLatLngObj(
  //         map,
  //         polygon(
  //           d.geometry.coordinates[0].length !== undefined
  //             ? d.geometry.coordinates[0]
  //             : d.geometry.coordinates
  //         )
  //           .getBounds()
  //           .getCenter()
  //       )
  //     );
  //     return getLatLngObj(
  //       map,
  //       polygon(
  //         d.geometry.coordinates[0].length !== undefined
  //           ? d.geometry.coordinates[0]
  //           : d.geometry.coordinates
  //       )
  //         .getBounds()
  //         .getCenter()
  //     ).x;
  //   })
  //   .attr("y", (d) => {
  //     return getLatLngObj(
  //       map,
  //       polygon(d.geometry.coordinates[0]).getBounds().getCenter()
  //     ).y;
  //   });

  const areas = locations
    .filter((d) => d.geometry.coordinates[0].length > 1)
    .append("path")
    .attr("pointer-events", "visible")
    .attr("d", (d) => {
      return path(d.geometry.coordinates[0]);
    })
    .attr("fill", (d) => {
      const isDining = d.properties.name.match(/Dining Commons/);
      const isFood = [
        "University Center",
        "Coral Tree Cafe",
        "Arbor",
        "Tenaya Market",
      ].includes(d.properties.name);
      return catColor[isDining ? "dining" : isFood ? "food" : "dorm"];
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

    // labels
    //   .attr("x", (d) => {
    //     return getLatLngObj(
    //       map,
    //       polygon(d.geometry.coordinates[0]).getBounds().getCenter()
    //     ).x;
    //   })
    //   .attr("y", (d) => {
    //     return getLatLngObj(
    //       map,
    //       polygon(d.geometry.coordinates[0]).getBounds().getCenter()
    //     ).y;
    //   });
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

  // areas
  //   .on("click", (_, d) => {
  //     console.log(d);
  //     tooltip.style("display", "block");
  //     tooltip.selectAll("*").remove();
  //     tooltip.append("h3").text(d.properties.name);
  //     tooltip
  //       .append("hr")
  //       .style("margin", "3px 0")
  //       .style("border", "none")
  //       .style("border-top", "1px solid #d3d3d3");
  //     tooltip
  //       .append("p")
  //       .text(`# Students in 2020-21: ${d3.format(",")(d.properties.val)}`);
  //     // tooltip.append('p').text(`Rank: ${d.properties.rank}`);
  //   })
  //   .on("mousemove", (event, d) => {
  //     const width = 200;
  //     const [mouseX, mouseY] = d3.pointer(event);

  //     tooltip
  //       .style("width", `${width}px`)
  //       .style("left", `${Math.min(mouseX, size.width - width - 30)}px`)
  //       .style("top", `${mouseY + 10}px`);
  //   })
  //   .on("mouseleave", (event, d) => {
  //     tooltip.style("display", "none");
  //   })
  //   .raise();
};

export default makePlot;
