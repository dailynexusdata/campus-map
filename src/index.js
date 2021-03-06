import * as d3 from "d3";
import "./styles.scss";
import "leaflet/dist/leaflet.css";

import makeLectureLocationsMap from "./lectureLocationsMap";
// import makeParkingLocations from "./parkingLocationsMap";
import makeDormsDiningLocations from "./dormsDiningLocations";

import makeMap from "./map";

(async () => {
  const data = await d3.json(
    // "editor/data/data.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/editor/data/data.json"
  );
  const names = await d3.json(
    // "editor/data/lectureNames.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/editor/data/lectureNames.json"
  );
  makeMap(data, names);

  const mapData = await d3.json(
    // "dist/buildings.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/dist/buildings.json"
  );
  const goldData = await d3.json(
    // "dist/department_lecture_locations.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/dist/department_lecture_locations.json"
  );
  const fullyOnline = await d3.json(
    // "dist/lectures_fully_online.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/dist/lectures_fully_online.json"
  );
  const partiallyOnline = await d3.json(
    // "dist/lectures_partially_online.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/dist/lectures_partially_online.json"
  );
  makeLectureLocationsMap(goldData, mapData, fullyOnline, partiallyOnline);

  // const parkingData = await d3.json("dist/parkingLots.json");
  // makeParkingLocations(null, parkingData);

  const dormsDiningData = await d3.json(
    // "dist/dormsAndDining.json"
    "https://raw.githubusercontent.com/dailynexusdata/campus-map/main/dist/dormsAndDining.json"
  );
  makeDormsDiningLocations(null, dormsDiningData);

  const update = () => {
    makeMap(data, names);
    makeLectureLocationsMap(goldData, mapData, fullyOnline, partiallyOnline);
    // makeParkingLocations(null, parkingData);
    makeDormsDiningLocations(null, dormsDiningData);
  };

  window.addEventListener("resize", () => {
    update();
  });
})();
