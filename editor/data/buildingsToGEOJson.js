const fs = require("fs");

// const buildingData = JSON.parse(
//   fs.readFileSync("data.json", "utf-8")
// ).buildings;

const convertGEOJSON = (buildingData) => {
  const output = { type: "FeatureCollection", features: [] };

  const makeCoordinates = ({ geometry }) => {
    const completeGeom = [...geometry, geometry[geometry.length - 1]];
    return [completeGeom.map((d) => [d.lng, d.lat])];
  };

  const makeFeature = (building) => {
    if (building.geometry.length === 1) {
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [building.geometry[0].lng, building.geometry[0].lat],
        },
        properties: {
          name: building.name,
          goldName: building.goldName,
        },
      };
    }

    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: makeCoordinates(building) },
      properties: {
        name: building.name,
        goldName: building.goldName,
      },
    };
  };

  buildingData.forEach((building) => {
    if (building.geometry.length > 0) {
      output.features.push(makeFeature(building));
    }
  });

  return output;
};

// fs.writeFileSync("../../dist/buildings.json", JSON.stringify(output));

module.exports = { convertGEOJSON };
