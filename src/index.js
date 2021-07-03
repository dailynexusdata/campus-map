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
  showBikePath: true,
  addBikePath: false,
  deleteBikePath: false,
  addBikeLink: false,
  deleteBikeLink: false,
  overlay: null,
  svg: null,
};

let data = null;

$("#saveButton").on("click", () => {
  $.ajax({
    type: "POST",
    url: "http://localhost:3330/save",
    data: { data: JSON.stringify(data) },
    success: "yes",
    dataType: "application/json",
  });
});

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

let currentLink = { source: -1, target: -1 };
const addBikePathLink = (id) => {
  if (currentLink.source === -1) {
    currentLink.source = id;
  } else {
    currentLink.target = id;
    data.bikePath.links.push(currentLink);
    currentLink = { source: -1, target: -1 };
  }
};

const getLatLng = ({ lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  const { x, y } = state.map.latLngToLayerPoint(ll);
  return state.map.latLngToLayerPoint(ll);
};
const bikePathLine = d3
  .line()
  .x((d) => getLatLng(d).x)
  .y((d) => getLatLng(d).y);
const addBikePathBubbles = () => {
  console.log(data.bikePath.nodes);
  state.svg
    .selectAll(".bikePathBubble")
    .data(data.bikePath.nodes)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "bikePathBubble")
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
          .attr("r", 7)
          .attr("pointer-events", "visible")
          .style("fill", "red")
          .on("click", function (event, { id: selectedId }) {
            if (state.deleteBikePath) {
              data.bikePath.nodes = data.bikePath.nodes.filter(
                ({ id }) => id !== selectedId
              );
            } else if (state.addBikeLink) {
              d3.select(this)
                .style("fill", "green")
                .transition()
                .duration(1000)
                .style("fill", "red");

              addBikePathLink(selectedId);
            }
            update();
          }),
      (update) =>
        update
          .attr("fill", "#89CFF0")
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y),
      (exit) => exit.remove()
    );
  state.svg
    .selectAll(".bikePathLink")
    .data(data.bikePath.links)
    .join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "bikePathLink")
          .attr("x1", (d) => {
            console.log(d);
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).y;
          })
          .attr("stroke-width", 10)
          .attr("stroke", "#89CFF0")
          .attr("pointer-events", "visible")
          .attr("fill", "red")
          .lower()
          .on("click", (event, { source, target }) => {
            console.log(source, target);
            data.bikePath.links = data.bikePath.links.filter(
              ({ source: s1, target: t1 }) => {
                return source !== s1 || target !== t1;
              }
            );
            update();
          }),
      (update) =>
        update
          .attr("fill", "#89CFF0")
          .attr("x1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).y;
          }),
      (exit) => exit.remove()
    );
};

const update = () => {
  if (state.showBikePath) {
    addBikePathBubbles();
  }
};

$("#bikePathButton").on("click", () => {
  state.showBikePath = !state.showBikePath;
  d3.selectAll(".bikePathBubble").attr("fill-opacity", state.showBikePath + 0);
  d3.selectAll(".bpLine").attr("stroke-width", state.showBikePath ? 5 : 0);
});

const addBikePathNode = ({ lat, lng }) => {
  const id =
    Math.max(
      ...data.bikePath.nodes.map((d) => (d.hasOwnProperty("id") ? d.id : 0)),
      0
    ) + 1;
  data.bikePath.nodes.push({ lat, lng, id });
};

$("#bikePathNodeAddButton").on("click", function () {
  state.addBikePath = !state.addBikePath;
  $(this).css({ "background-color": state.addBikePath ? "green" : "" });
});

$("#bikePathNodeDeleteButton").on("click", function () {
  state.deleteBikePath = !state.deleteBikePath;
  $(this).css({ "background-color": state.deleteBikePath ? "green" : "" });
});
$("#bikePathLinkAddButton").on("click", function () {
  state.addBikeLink = !state.addBikeLink;
  $(this).css({ "background-color": state.addBikeLink ? "green" : "" });
});
$("#bikePathLinkDeleteButton").on("click", function () {
  state.deleteBikeLink = !state.deleteBikeLink;
  $(this).css({ "background-color": state.deleteBikeLink ? "green" : "" });
});
$.ajax({
  type: "GET",
  url: "http://localhost:3330/data",
  crossDomain: true,
  dataType: "json",
}).done((res) => {
  state.map = L.map("map").setView(Object.values(res.mapCenter), res.mapZoom);
  state.map.addLayer(simpleMap);

  state.map.on("click", function (e) {
    // const { lat, lng } = e.latlng;
    if (state.addBikePath) {
      console.log("HERE");
      addBikePathNode(e.latlng);
      update();
    }
  });
  L.svg().addTo(state.map);
  state.overlay = d3.select(state.map.getPanes().overlayPane);
  state.svg = state.overlay.select("svg");
  data = res;

  addBikePathBubbles();
  state.map.on("moveend", () => {
    update();
  });
});
