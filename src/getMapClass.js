import * as L from "leaflet";
import * as d3 from "d3";

class GetMap {
  constructor(
    id,
    includeButton = true,
    mapCenter = [34.411937314426886, -119.84639883041383],
    mapZoom = 15.4,
    args = {}
  ) {
    this.mapType = "simple";
    const container = d3.select("#" + id);

    const width = Math.min(window.innerWidth - 40, 600);

    container
      .append("div")
      .attr("id", id + "-map")
      .style("height", "500px")
      .style("width", `${width}px`);

    if (includeButton)
      container
        .append("div")
        .style("display", "flex")
        .style("justify-content", "flex-end")
        .style("margin", "10px")
        .style("width", `${width}px`)
        .append("button")
        .attr("id", id + "-switchMapButton")
        .attr("class", "campusMapButton")
        .text("Switch Map");

    const map = L.map(id + "-map", args).setView(mapCenter, mapZoom);

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

    if (includeButton)
      $(`#${id}-switchMapButton`).on("click", () => {
        if (this.mapType === "simple") {
          map.removeLayer(simpleMap);
          map.addLayer(satelliteMap);
          this.mapType = "satellite";
        } else {
          map.removeLayer(satelliteMap);
          map.addLayer(simpleMap);
          this.mapType = "simple";
        }
      });

    // add svg over the map:
    map.addLayer(simpleMap);
    L.svg().addTo(map);

    const overlay = d3.select(map.getPanes().overlayPane);
    const svg = overlay.select("svg");

    return [map, svg];
  }
}

export default GetMap;
