const fs = require("fs");

const buildingData = JSON.parse(
  fs.readFileSync("data/data.json", "utf-8")
).buildings;

const output = { type: "FeatureCollection", features: [] };

const makeCoordinates = ({ geometry }) => {
  const completeGeom = [...geometry, geometry[geometry.length - 1]];
  return [completeGeom.map((d) => [d.lng, d.lat])];
};

const makeFeature = (building) => {
  const feat = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: makeCoordinates(building) },
    properties: { name: building.name },
  };
  return feat;
};

buildingData.forEach((building) => {
  output.features.push(makeFeature(building));
});

fs.writeFileSync("../dist/buildings.json", JSON.stringify(output));
