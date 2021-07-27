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

const getLatLng = ({ lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  const { x, y } = state.map.latLngToLayerPoint(ll);
  return state.map.latLngToLayerPoint(ll);
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
  state.overlay = d3.select(state.map.getPanes().overlayPane);
  state.svg = state.overlay.select("svg");

  state.map.on("click", function (e) {
    if (state.addBikePath) {
      //add bikePathNode from bikePathMapping.js
      addBikePathNode(e.latlng);
      update();
    } else if (state.buildingSelection) {
      addBuildingNode(e.latlng);
    } else if (state.bikeLotSelection) {
      addBikeLotNode(e.latlng);
    }
  });

  // call update function when move map
  // from index.js
  state.map.on("moveend", () => {
    update();
  });

  // update first time
  update();
};
