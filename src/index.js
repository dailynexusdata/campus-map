import * as d3 from "d3";
import * as L from "leaflet";

import COLORS from "./colors";

const simpleMap = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }
);
const satelliteMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

const state = {
  mapType: "simple",
  map: null,
};

$("#switchMapButton").on("click", () => {
  if (state.mapType === "simple") {
    state.map.removeLayer(simpleMap);
    state.map.addLayer(satelliteMap);
    state.mapType = "satellite";
  } else {
    state.map.removeLayer(satelliteMap);
    state.map.addLayer(simpleMap);
    state.mapType = "simple";
  }
});
const setupMap = (data) => {
  // set map view
  state.map = L.map("map").setView(Object.values(data.mapCenter), data.mapZoom);

  // add svg over the map:
  state.map.addLayer(simpleMap);
  L.svg().addTo(state.map);
  const overlay = d3.select(state.map.getPanes().overlayPane);
  state.svg = overlay.select("svg");

  state.map.on("click", function (e) {});

  // call update function when move map
  // from index.js
  state.map.on("moveend", () => {
    update();
  });

  // update first time
  // update();
};

const getLatLng = ({ lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  const { x, y } = state.map.latLngToLayerPoint(ll);
  return state.map.latLngToLayerPoint(ll);
};

const drawPath = (path, data) => {
  // const points = data.bikePath.nodes.filter(({ id }) => path.includes(id));

  const points = path.map((i) =>
    data.bikePath.nodes.find(({ id }) => id === i)
  );

  state.svg
    .selectAll(".nodes")
    .data(points)
    .join(
      (enter) => {
        enter
          .append("circle")
          .attr("class", "nodes")
          .attr("fill", COLORS.bikePath)
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
          .attr("r", 2.5);
      },
      (update) => {
        update
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y);
      }
    );

  const connections = [];

  // combine consecutive points together to be able to create lines
  points.reduce((prev, curr) => {
    connections.push({ prev, curr });
    return curr;
  });

  state.svg
    .selectAll(".links")
    .data(connections)
    .join(
      (enter) => {
        enter
          .append("line")
          .attr("stroke", COLORS.bikePath)
          .attr("stroke-width", 5)
          .attr("class", "links")
          .attr("x1", (d) => getLatLng(d.prev).x)
          .attr("y1", (d) => getLatLng(d.prev).y)
          .attr("x2", (d) => getLatLng(d.curr).x)
          .attr("y2", (d) => getLatLng(d.curr).y);
      },
      (update) => {
        update
          .attr("x1", (d) => getLatLng(d.prev).x)
          .attr("y1", (d) => getLatLng(d.prev).y)
          .attr("x2", (d) => getLatLng(d.curr).x)
          .attr("y2", (d) => getLatLng(d.curr).y);
      }
    );
};

const getPath = (startId, endId, data) => {
  /**
   *
   * Implement search algorithms here
   *
   */
  const links = data.bikePath.links;

  console.log(links);

  // output the id's of the nodes to visit
  // this gets passed directly into the drawPath() function
  return [1, 2, 3, 4, 5];
};

const update = () => {
  drawPath(getPath(1, 5, state.data), state.data);
};

(async () => {
  const data = await d3.json("dist/data.json"); // I just have fake data to test

  console.log(data);
  setupMap(data);
  state.data = data;
  update();
})();