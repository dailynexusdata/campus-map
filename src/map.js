import GetMap from "./getMapClass";
import * as d3 from "d3";
import autoComplete from "./autocomplete";
import drawBuildings from "./buildings";

const COLORS = { bikePath: "#89CFF0" };

/**
 *  //////////////////////////////////////////////////////////////////////
 *  Aux functions
 *  //////////////////////////////////////////////////////////////////////
 */
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

const getLatLng = ({ lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  return state.map.latLngToLayerPoint(ll);
};

/**
 *  //////////////////////////////////////////////////////////////////////
 *  PATH FINDING
 *  //////////////////////////////////////////////////////////////////////
 */

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
  //console.log(getChildren(startId,data));
  //console.log(startId,endId);
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
      //console.log(prev);
      var path = getMap(prev, startId, endId);
      //Testing getDist func
      console.log(getPathDist(path, data));
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
  var path = getMap(prev, startId, endId);
  //Testing getDist func
  console.log(getPathDist(path, data));
  // output the id's of the nodes to visit
  // this gets passed directly into the drawPath() function
  //console.log(prev);
  return path;
};

// + we could do it for the stuff in the drawing function
const pathCache = {
  start: -1,
  end: -1,
  path: [],
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

//Helper Function, given a path returns the distance
//If path doesn't exist then -1 is returned
const getPathDist = (path, data) => {
  const links = data.bikePath.links;
  var currDist = 0;
  for (var i = 0; i < path.length - 1; i++) {
    if (getRelation(path[i], path[i + 1], data) === -1) {
      return -1;
    }
    currDist += getRelation(path[i], path[i + 1], data);
  }
  var currArr = [currDist];
  return currArr;
};

/**
 *  //////////////////////////////////////////////////////////////////////
 *  Map Drawing
 *  //////////////////////////////////////////////////////////////////////
 */

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

  drawBuildings(state.map, state.svg, state.data.buildings);
};

/**
 *  //////////////////////////////////////////////////////////////////////
 *  EXPORT
 *  //////////////////////////////////////////////////////////////////////
 */

const state = {
  mapType: "simple",
  map: null,
  // startId: 212,
  // endId: 25,
  startId: 212,
  endId: 25,
  queue: [],
};

const makeMap = (data, names) => {
  const container = d3.select("#campusMapSearch");
  container.selectAll("*").remove();

  state.data = data;

  const size = {
    height: 600,
    width: Math.min(600, window.innerWidth - 40),
  };

  container
    .append("div")
    .attr("id", "campusMapSearchMap")
    .style("width", size.width + "px");

  [state.map, state.svg] = new GetMap("campusMapSearchMap");

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

  // for the campus map main search
  autoComplete(names, (selected) => {
    const geom = state.data.buildings.find((d) => d.name === selected);
    drawBuildings(state.map, state.svg, [geom]);
  });

  update();
};

export default makeMap;
