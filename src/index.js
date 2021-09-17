import * as d3 from "d3";
import * as L from "leaflet";
import "./styles.scss";
import "leaflet/dist/leaflet.css";

import COLORS from "./colors";

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
  startId_1: 212,
  endId_1: 25,
  startId_2: 21,
  endId_2: 24,
  startId_3: 26,
  endId_3: 47,
  walking_queue_1: [],
  biking_queue: [],
  walking_queue_2: [],
  pathType: "walkingPath"
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

const setupMap = (data, pathType) => {
  // set map view
  state.map = L.map("map").setView(Object.values(data.mapCenter), data.mapZoom);

  // add svg over the map:
  state.map.addLayer(simpleMap);
  L.svg().addTo(state.map);
  const overlay = d3.select(state.map.getPanes().overlayPane);
  state.svg = overlay.select("svg");
  const lotQ = [];
  state.map.on("click", function (e) {
    //Make check for bikepath, if so use find bikelot func and draw
    //otherwise continue as normal
    
    if (state.pathType === 'bikePath'){
      //First define a queue for the bikeLots (make this apart of state later on)
      
      //Then call the func to find the closest bike lot to the latlng
      const clickedLot = closestLot(e.latlng.lat,e.latlng.lng,state.data);
      lotQ.push(clickedLot);
      console.log(lotQ);
      state.biking_queue.push(data.bikeLot[clickedLot].entrance);

      const closestNode = data['walkingPath'].nodes.reduce((acc, p) => {
        const pDistance = distance(p, e.latlng);
        const accDistance = distance(acc, e.latlng);
        return accDistance < pDistance ? acc : p;
      });

      state.walking_queue_1.push(closestNode);
      if (state.biking_queue.length === 2) {
        state.startId_1 = state.walking_queue_1[0].id;
        state.endId_1 = nearestWalkingNodeLot(lotQ[0],data).id; 
        state.startId_2 = state.biking_queue[0];
        state.endId_2 = state.biking_queue[1];
        state.startId_3 = nearestWalkingNodeLot(lotQ[1],data).id
        state.endId_3 = state.walking_queue_1[1].id;
        state.biking_queue = [];
        state.walking_queue_1 = [];
        state.walking_queue_2 = [];
        console.log(state);
        debugger;
        update();
      }
    }
    else{
      const closestNode = data[state.pathType].nodes.reduce((acc, p) => {
        const pDistance = distance(p, e.latlng);
        const accDistance = distance(acc, e.latlng);
        return accDistance < pDistance ? acc : p;
      });
      state.walking_queue_1.push(closestNode);
      if (state.walking_queue_1.length === 2) {
        state.startId_1 = state.walking_queue_1[0].id;
        state.endId_1 = state.walking_queue_1[1].id;
        state.walking_queue_1 = [];
        update();
      }
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

const drawPath = (path, data, pathType) => {
  // const points = data.bikePath.nodes.filter(({ id }) => path.includes(id));
  console.log(COLORS[pathType]);
  const points = path.map((i) =>
    data[pathType].nodes.find(({ id }) => id === i)
  );

  state.svg
    .selectAll(".nodes")
    .data(points)
    .join(
      (enter) => {
        enter
          .append("circle")
          .attr("class", "nodes")
          .attr("fill", COLORS[pathType])
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
          .attr("stroke", COLORS[pathType])
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

const getPath = (startId, endId, pathType, data) => {
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
  visited.add((startId,0));
  const links = data[pathType].links;
  //console.log(getChildren(startId,data));
  //console.log(startId,endId);
  while(q.length>0){
    //Get next node in the queue
    const node = q.shift();

    //Check if it has been visted, if so skip
    if(visited.has(node)){
      continue;
    }
    //If it is the end id then you found the path
    //with the least weight
    if(node===endId){
      //console.log(prev);
      var path = getMap(prev,startId,endId);
      //Testing getDist func
      console.log(getPathDist(path,pathType,data));
      return getMap(prev,startId,endId);
    }
    //Otherwise add the children to the queue
    const newChildren = [];
    for(const child of getChildren(node,pathType,data)){
      //Add Children to queue with weight included
      if(!visited.has(child)){
        prev.set(child,node);
        newChildren.push(child);       
        weights.set(child,weights[node]+getRelation(node,child,pathType,data));
      }
    }
    //Add the unvisited children to the queue
    q = q.concat(newChildren);
    visited.add(node);
    q.sort((a,b) => (weights[a]>weights[b]) ? 1 : -1 );
  }
  var path = getMap(prev,startId,endId);
  //Testing getDist func
  console.log(getPathDist(path,pathType,data));
  // output the id's of the nodes to visit
  // this gets passed directly into the drawPath() function
  //console.log(prev);
  console.log(path);
  return path;
};

// idk if this is a good idea
// + we could do it for the stuff in the drawing function
const pathCache = {
  walk_start_1: -1,
  walk_end_1: -1,
  bike_start: -1,
  bike_end: -1,
  walk_start_2: -1,
  walk_end_2: -1,
  walk_path_1: [],
  bike_path: [],
  walk_path_2: []
};

const update = () => {
  console.log(pathCache);
  if (
    pathCache.walk_start_1 !== state.startId_1 ||
    pathCache.walk_end_1 !== state.endId_1 ||
    pathCache.walk_path_1.length === 0
  ) {
    debugger;
    pathCache.walk_start_1 = state.startId_1;
    pathCache.walk_end_1 = state.endId_1;
    pathCache.walk_path_1 = getPath(state.startId_1, state.endId_1,'walkingPath',state.data);
  }
  if (
    pathCache.walk_start_2 !== state.startId_3 ||
    pathCache.walk_end_2 !== state.endId_3 ||
    pathCache.walk_path_2.length === 0
  ) {
    debugger;
    pathCache.walk_start_2 = state.startId_3;
    pathCache.walk_end_2 = state.endId_3;
    pathCache.walk_path_2 = getPath(state.startId_3, state.endId_3,'walkingPath',state.data);
  }
  if (
    pathCache.bike_start !== state.startId_2 ||
    pathCache.bike_end !== state.endId_2 ||
    pathCache.bike_path.length === 0
  ) {
    debugger;
    pathCache.bike_start = state.startId_2;
    pathCache.bike_end = state.endId_2;
    pathCache.bike_path = getPath(state.startId_2, state.endId_2,'bikePath',state.data);
  }
  if(state.pathType === 'walkingPath'){
    drawPath(pathCache.walk_path_1, state.data, state.pathType);
  }
  if(state.pathType === 'bikePath'){
    console.log(pathCache);
    debugger;
    drawPath(pathCache.walk_path_1, state.data, 'walkingPath');
    
    drawPath(pathCache.walk_path_2, state.data, 'walkingPath');

    drawPath(pathCache.bike_path, state.data, 'bikePath');
  }
};

(async () => {
  const data = await d3.json("editor/data/data.json"); // I just have fake data to test

  setupMap(data,state.pathType);
  state.data = data;
  update();

  // setTimeout(() => {
  //   state.startId = 212;
  //   state.endId = 25;
  //   update();
  // }, 4000);
})();

//Just a helper function to get the closest neighbor
const getShort = (neighborID, pathType, data) => {
  var neighbors = [];
  const links = data[pathType].links;
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
const getChildren = (parentID, pathType, data) => {
  var children = [];
  const links = data[pathType].links;
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
const getRelation = (parent,child,pathType,data) => {
  const links = data[pathType].links;
  for(var i = 0;i<links.length;i++){
    if(links[i].source===parent && links[i].target===child){
      return links[i].distance;
    }
  }
  return -1;
};

//Helper Function, given a path returns the distance
//If path doesn't exist then -1 is returned
const getPathDist = (path,pathType,data) => {
  const links = data[pathType].links;
  var currDist = 0;
  for(var i = 0;i<path.length-1;i++){
    if(getRelation(path[i],path[i+1],pathType,data)===-1){return -1;}
    currDist+=getRelation(path[i],path[i+1],pathType,data);
  }
  var currArr = [currDist];
  return currArr;
};

$("#bikePath").on("click", function () {
  state.pathType = "bikePath";
  pathCache.path = [];
  pathCache.start = -1;
  pathCache.end = -1;
  console.log(state.pathType);
});

$("#walkingPath").on("click", function () {
  state.pathType = "walkingPath";
  pathCache.path = [];
  pathCache.start = -1;
  pathCache.end = -1;
  console.log(state.pathType);
});

//Given lat and lng coordinates locate the closest bikelot
const closestLot = (lat,lng,data) => {
  var lotCenter = {};
  for(const lot in data.bikeLot){
    var avg_coord = {};
    avg_coord.lat = 0;
    avg_coord.lng = 0;
    for(const coord in data.bikeLot[lot]['geometry']){
      avg_coord.lat += data.bikeLot[lot]['geometry'][coord].lat;
      avg_coord.lng += data.bikeLot[lot]['geometry'][coord].lng;
    }
    if(data.bikeLot[lot]['geometry'].length>0){
      avg_coord.lat = avg_coord.lat/data.bikeLot[lot]['geometry'].length;
      avg_coord.lng = avg_coord.lng/data.bikeLot[lot]['geometry'].length;
      lotCenter[lot] = avg_coord; 
    }
  }
  var e = {};
  e.lat = lat;
  e.lng = lng;
  var minDist = distance(lotCenter[0],e);
  var minId = 0;
  var dists = [];
  
  for(const lot in lotCenter){
    if(distance(lotCenter[lot],e)<minDist){
      minDist = distance(lotCenter[lot],e);
      minId = lot;
    }
    dists.push(distance(lotCenter[lot],e));
  }
  //console.log(dists);
  return minId;

}

const nearestWalkingNodeLot = (lotId,data) => {
  var avg_coord = {};
  avg_coord.lat = 0;
  avg_coord.lng = 0;
  for(const coord in data.bikeLot[lotId]['geometry']){
    avg_coord.lat += data.bikeLot[lotId]['geometry'][coord].lat;
    avg_coord.lng += data.bikeLot[lotId]['geometry'][coord].lng;
  }
  if(data.bikeLot[lotId]['geometry'].length>0){
    avg_coord.lat = avg_coord.lat/data.bikeLot[lotId]['geometry'].length;
    avg_coord.lng = avg_coord.lng/data.bikeLot[lotId]['geometry'].length; 
  }
  const closestNode = data['walkingPath'].nodes.reduce((acc, p) => {
    const pDistance = distance(p, avg_coord);
    const accDistance = distance(acc, avg_coord);
    return accDistance < pDistance ? acc : p;
  });
  return closestNode;
}