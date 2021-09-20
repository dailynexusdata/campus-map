import * as d3 from "d3";
import GetMap from "./getMapClass";
import { polygon } from "leaflet";

const toGeooJson = (obj) => ({ type: "FeatureCollection", features: obj });

const getLatLng = (leaflet, [lng, lat]) => {
  const ll = new L.latLng(lat, lng);
  return leaflet.latLngToLayerPoint(ll);
};

const getLatLngObj = (leaflet, { lng, lat }) => {
  const ll = new L.latLng(lng, lat);
  return leaflet.latLngToLayerPoint(ll);
};

const selectDept = (leaflet, map, svg, size) => {
  // Setup the projection and then translate a lil bit so its not cut off

  const proj = d3.geoMercator().fitSize([size.width - 10, size.height], map);

  // const projection = d3
  //   .geoMercator()
  //   .scale(proj.scale())
  //   .translate([proj.translate()[0] + 5, proj.translate()[1]]);

  // const path = d3.geoPath().projection(projection);

  const path = d3
    .line()
    .x((d) => getLatLng(leaflet, d).x)
    .y((d) => getLatLng(leaflet, d).y);

  const colors = d3.scaleSequential(d3.interpolateBlues);

  const locations = svg
    .selectAll(".campus-map-buildings")
    .data(map.features)
    .join(
      (enter) => {
        enter
          .append("path")
          .attr("class", "campus-map-buildings")
          .attr("d", (d) => {
            // if (d.properties.name[0] === "Campus Pool") {
            //   console.log(d, path(d));
            // }
            return path(d.geometry.coordinates[0]);
          })
          .on("mousemove", (_, d) => {
            // console.log(d);
          })
          .style("pointer-events", "visible")
          .attr("stroke", "black")
          .attr("fill", "red")
          .attr("fill-opacity", (d) => {
            return Math.min(1, (2 * d.data.count) / d.data.total);
          })
          .raise();
      },
      (update) => {
        update.attr("d", (d) => {
          return path(d.geometry.coordinates[0]);
        });
      },
      (exit) => exit.remove()
    );

  const bottomTextLocations = [
    "Girvetz Hall",
    "Buchanan Hall",
    "Life Sciences",
  ];

  const getTextPositioning = (d) => {
    if (bottomTextLocations.includes(d.properties.name)) {
      return polygon(d.geometry.coordinates).getBounds().getSouthWest();
    }

    return polygon(d.geometry.coordinates).getBounds().getNorthEast();
  };

  svg
    .selectAll(".campus-map-text")
    .data(map.features)
    .join(
      (enter) => {
        enter
          .append("text")
          .text(
            (d) =>
              (leaflet.getZoom() >= 16 ? d.properties.goldName + " - " : "") +
              Math.round((100 * d.data.count) / d.data.total) +
              "%"
          )
          .attr("text-anchor", "middle")
          .attr("class", "campus-map-text")
          .attr("font-weight", "bold")
          .attr("x", (d) => {
            // console.log(polygon(d.geometry.coordinates).getBounds().getNorth());
            return getLatLngObj(
              leaflet,
              polygon(d.geometry.coordinates).getBounds().getCenter()
            ).x;
          })
          .attr("y", (d) => {
            return (
              getLatLngObj(leaflet, getTextPositioning(d)).y +
              (bottomTextLocations.includes(d.properties.name) ? +14 : -2)
            );
          });
      },
      (update) => {
        update
          .text(
            (d) =>
              (leaflet.getZoom() >= 16 ? d.properties.goldName + " - " : "") +
              Math.round((100 * d.data.count) / d.data.total) +
              "%"
          )
          .attr("x", (d) => {
            return getLatLngObj(
              leaflet,
              polygon(d.geometry.coordinates).getBounds().getCenter()
            ).x;
          })
          .attr("y", (d) => {
            return (
              getLatLngObj(leaflet, getTextPositioning(d)).y +
              (["Girvetz Hall", "Buchanan Hall"].includes(d.properties.name)
                ? +10
                : -2)
            );
          })
          .raise();
      },
      (exit) => exit.remove()
    );
};

const makeScrollingList = (data, area, size, title) => {
  area
    .append("h3")
    .text("Courses " + title)
    .style("margin", "20px 0 0 0");

  const la = area
    .append("div")
    .style("overflow-y", "scroll")
    .style("scrollbar-width", "thin")
    .style("height", size.height + "px")
    .style("width", size.width + "px");

  la.append("ul")
    .style("padding", 0)
    .style("margin", 0)
    .selectAll("li")
    .data(data.which.map((d) => d[0]))
    .enter()
    .append("li")
    .text((d) => d)
    .style("line-height", "20pt")
    .style("font-size", "12pt")
    .style("background-color", (d, i) => (i % 2 === 0 ? "#d3d3d344" : "white"));
};

const makePlot = (goldData, mapData, fullyOnline, partiallyOnline) => {
  // console.log(mapData);

  const size = {
    height: 600,
    width: Math.min(600, window.innerWidth - 40),
  };

  const container = d3
    .select("#lectureLocations")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center");
  // .style("width", `${size.width}px`);
  container.selectAll("*").remove();

  const inputBar = container.append("div").style("width", `${size.width}px`);

  const hoverArea = container
    .append("div")
    .style("position", "relative")
    .attr("id", "lectureLocationsHover")
    .style("width", `${size.width}px`);

  // const [map, svg] = getMap("lectureLocationsHover");
  const [map, svg] = new GetMap("lectureLocationsHover", false);

  svg.attr("pointer-events", "visible").style("pointer-events", "visible");

  d3.select(map.getPanes().overlayPane).attr("pointer-events", "auto");

  inputBar.append("label").text("Select a Department:");
  const input = inputBar
    .append("input")
    .style("margin", "10px")
    .style("padding", "5px")
    .style("width", "240px")
    .style("font-size", "12pt");

  const datalist = inputBar
    .append("datalist")
    .attr("id", "labby-campus-map-lecture-locations-datalist");

  const table = container
    .append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("margin-top", "20px")
    .style("width", Math.min(600, window.innerWidth - 40) + "px")
    .append("table")
    .style("width", Math.min(600, window.innerWidth - 40) + "px")
    .style("border-collapse", "collapse");
  table
    .append("thead")
    .append("tr")
    .style("border-bottom", "1px solid #d3d3d3")
    .selectAll("td")
    .data(["Building", "# Lectures", "% Lectures"])
    .enter()
    .append("th")
    .style("min-width", (_, i) => (i === 0 ? "100px" : "90px"))
    .style("text-align", (_, i) => (i === 0 ? "left" : "right"))
    .text((d) => d);

  const tbody = table.append("tbody").style("padding", "5px 0");
  const tfooter = table.append("tfoot");

  const makeTable = (data) => {
    tbody.selectAll("*").remove();
    tfooter.selectAll("*").remove();

    tbody
      .selectAll("tr")
      .data(
        data.sort((a, b) => {
          const diff = b.count - a.count;
          return diff === 0 ? (a.name < b.name ? 1 : -1) : diff;
        })
      )
      .enter()
      .append("tr")
      .style("background-color", (_, i) =>
        i % 2 === 0 ? "#d3d3d333" : "white"
      )
      .selectAll("td")
      .data((d) => {
        const td = [
          d.building,
          d.count,
          Math.round((d.count / d.total) * 10000) / 100 + "%",
        ];
        return td;
      })
      .enter()
      .append("td")
      .style("text-align", (_, i) => (i === 0 ? "left" : "right"))
      .text((d) => d);

    tfooter
      .selectAll("tr")
      .data([data[0]])
      .enter()
      .append("tr")
      .style("border-top", "1px solid #d3d3d3")
      .selectAll("th")
      .data((d) => ["Total", d.total, ""])
      .enter()
      .append("th")
      .style("text-align", (_, i) => (i === 0 ? "left" : "right"))
      .text((d) => d);
  };

  let currDeptName = "Anthropology";
  let deptData = null;
  let deptMap = null;

  const reDraw = () => {
    selectDept(map, toGeooJson(deptMap), svg, size);
  };

  const updateMap = () => {
    const deptFull = goldData.find((d) => d.key === currDeptName);

    if (!deptFull) {
      return;
    }

    deptData = deptFull.values;
    deptMap = deptData
      .map((d) => {
        const buildings = mapData.features.filter(
          (m) =>
            m.properties.goldName &&
            m.properties.goldName.toLowerCase() === d.building.toLowerCase()
        );
        return buildings;
      })
      .reduce((a, b) => [...a, ...b], [])
      .map((d) => ({
        ...d,
        data: deptData.find((b) => d.properties.goldName === b.building),
      }));

    makeTable(deptData);
    reDraw();
  };

  map.on("moveend", () => {
    reDraw();
  });

  updateMap();

  input
    .attr("list", "labby-campus-map-lecture-locations-datalist")
    .on("click", (event) => {
      event.target.value = "";
    })
    .on("change", (d) => {
      currDeptName = d.target.value;
      map.setView([34.411937314426886, -119.84639883041383], 15.4);
      updateMap();
    });

  datalist
    .selectAll("option")
    .data(goldData)
    .enter()
    .append("option")
    .attr("value", (d) => d.key);

  input.attr("value", "Anthropology");

  const nfo = 1;
  const npo = 1;

  container
    .append("p")
    .style("margin-bottom", 0)
    .text(
      `However, not all courses will be taught in person this upcoming quarter. ` +
        `There are ${fullyOnline.number_total} undergraduate lectures that are fully online for Fall Quarter 2021, ` +
        `and ${partiallyOnline.number_total} lectures that are in person on some days and remote on others. ` +
        `These course names are listed below.`
    )
    .style("font-family", "Georgia, serif")
    .style("padding", "0 20px")
    .style("font-size", "16.8px")
    .style("letter-spacing", "1px")
    .style("line-height", "26.88px");

  const listArea = container
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-around")
    .style("flex-wrap", "wrap")
    .style("width", "100%");
  const listLeft = listArea.append("div");
  const listRight = listArea.append("div");

  const listSize = {
    height: 400,
    width: Math.min(window.innerWidth - 40, 360),
  };

  makeScrollingList(fullyOnline, listLeft, listSize, "Fully Online");
  makeScrollingList(partiallyOnline, listRight, listSize, "Partially Online");
};

export default makePlot;
