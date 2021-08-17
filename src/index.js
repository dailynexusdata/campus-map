import * as d3 from "d3";
import * as L from "leaflet";
import "./styles.scss";
import "leaflet/dist/leaflet.css";

import COLORS from "./colors";

import makeLectureLocations from "./lectureLocations";

const container = d3.select("#campusMapSearch");

container.html(`<div id="map" style='width: 600px; height: 500px;'></div>
<div style="width: 600px; display: flex; justify-content: flex-end; margin: 10px">
    <button id="switchMapButton" class='campusMapButton'>Switch Map</button>
</div>`);

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
  // startId: 212,
  // endId: 25,
  startId: 76,
  endId: 34,
  queue: [],
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

let clicks = [];

const clickAnimation = (clicks) => {
  state.svg
    .selectAll(".clickPulse")
    .data(clicks)
    .join((enter) => {
      enter
        .append("circle")
        .attr("class", "clickPulse")
        .attr("cx", (d) => getLatLng(d[0]).x)
        .attr("cy", (d) => getLatLng(d[0]).y)
        .attr("r", ([_, r]) => r)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .transition()
        .duration(500)
        .attr("r", 0)
        .remove()
        .on("end", (d) => {
          clicks.splice(clicks.indexOf(d), 1);
        });
    });
};

const distance = (p1, p2) => {
  //https://stackoverflow.com/a/18883819
  const toRad = (x) => (x * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const setupMap = (data) => {
  // set map view
  state.map = L.map("map").setView(Object.values(data.mapCenter), data.mapZoom);

  // add svg over the map:
  state.map.addLayer(simpleMap);
  L.svg().addTo(state.map);
  const overlay = d3.select(state.map.getPanes().overlayPane);
  state.svg = overlay.select("svg");

  state.map.on("click", function (e) {
    const closestNode = data.bikePath.nodes.reduce((acc, p) => {
      const pDistance = distance(p, e.latlng);
      const accDistance = distance(acc, e.latlng);
      return accDistance < pDistance ? acc : p;
    });
    state.queue.push(closestNode);

    if (state.queue.length === 2) {
      state.startId = state.queue[0].id;
      state.endId = state.queue[1].id;
      state.queue = [];
      update();
    }
    clicks.push([e.latlng, 20]);
    clickAnimation(clicks);
  });

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
  var q = [];
  var visited = new Set();
  var prev = new Map();
  var weights = new Map();
  q.push(startId);
  visited.add((startId, 0));
  const links = data.bikePath.links;
  console.log(getChildren(startId, data));
  console.log(startId, endId);
  while (q.length > 0) {
    //Get next node in the queue
    const node = q.shift();

    //Check if it has been visted, if so skip
    if (visited.has(node)) {
      continue;
    }
    //If it is the end id then you found the path
    //with the least weight
    if (node === endId) {
      console.log(prev);
      return getMap(prev, startId, endId);
    }
    //Otherwise add the children to the queue
    const newChildren = [];
    for (const child of getChildren(node, data)) {
      //Add Children to queue with weight included
      if (!visited.has(child)) {
        prev.set(child, node);
        newChildren.push(child);
        weights.set(child, weights[node] + getRelation(node, child, data));
      }
    }
    //Add the unvisited children to the queue
    q = q.concat(newChildren);
    visited.add(node);
    q.sort((a, b) => (weights[a] > weights[b] ? 1 : -1));
  }
  // output the id's of the nodes to visit
  // this gets passed directly into the drawPath() function
  //console.log(prev);
  return getMap(prev, startId, endId);
};

// idk if this is a good idea
// + we could do it for the stuff in the drawing function
const pathCache = {
  start: -1,
  end: -1,
  path: [],
};

const update = () => {
  if (
    pathCache.start !== state.startId ||
    pathCache.end !== state.endId ||
    pathCache.path.length === 0
  ) {
    pathCache.start = state.startId;
    pathCache.end = state.endId;
    pathCache.path = getPath(state.startId, state.endId, state.data);
  }
  drawPath(pathCache.path, state.data);
};

(async () => {
  const data = await d3.json("editor/data/data.json"); // I just have fake data to test

  setupMap(data);
  state.data = data;
  update();

  // setTimeout(() => {
  //   state.startId = 212;
  //   state.endId = 25;
  //   update();
  // }, 4000);
})();

//Just a helper function to get the closest neighbor
const getShort = (neighborID, data) => {
  var neighbors = [];
  const links = data.bikePath.links;
  for (let i = 0; i < links.length; i++) {
    if (links[i].source == neighborID) {
      var neighbor = (links[i].target, links[i].distance);
      neighbors.push(neighbor);
    }
  }
  neighbors.sort((a, b) => (a[1] > b[1] ? 1 : -1));
  return neighbors[0][0];
};

//Helper function to get children of a node
const getChildren = (parentID, data) => {
  var children = [];
  const links = data.bikePath.links;
  for (var i = 0; i < links.length; i++) {
    if (links[i].source === parentID) {
      var child = [links[i].target, links[i].distance];
      //console.log(child);
      children.push(child);
    }
  }
  //console.log(children);
  children.sort((a, b) => (a[1] > b[1] ? 1 : -1));
  return children.map((x) => x[0]);
};

//Helper function to decode map
const getMap = (resMap, start, end) => {
  var path = [];
  path.push(end);
  while (!path.includes(start)) {
    path.push(resMap.get(path[path.length - 1]));
  }
  return path.reverse();
};

//Helper function that returns distance between parent and child
const getRelation = (parent, child, data) => {
  const links = data.bikePath.links;
  for (var i = 0; i < links.length; i++) {
    if (links[i].source === parent && links[i].target === child) {
      return links[i].distance;
    }
  }
  return -1;
};

(async () => {
  const mapData = await d3.json("dist/buildings.json");
  makeLectureLocations(mapData);
})();
