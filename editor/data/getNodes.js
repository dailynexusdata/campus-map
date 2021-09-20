const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");
const { convertGEOJSON } = require("./buildingsToGEOJson");

const buildingNames = [];
const geometry = [];

const nameConversion = JSON.parse(
  fs.readFileSync("lectureNames.json", "utf-8")
);

const openFile = (fileName) => {
  const file = fs.readFileSync(fileName.path, "utf-8");
  const $nodes = cheerio.load(file);

  const nodes = [];
  $nodes("nd").each((i, el) => nodes.push(el.attribs["ref"]));
  const output = { geometry: [], name: fileName.name, group: fileName.group };

  const goldName = nameConversion.find((d) => d.geometryName === fileName.name);
  if (goldName) {
    output["goldName"] = goldName.goldName;
  }

  const fileData = fs.readFileSync(`${fileName.path}_nodes`, "utf-8");
  const $ = cheerio.load(fileData);

  const geom = [];

  $("node").each((i, el) => {
    const { lat, lon, id } = el.attribs;
    if (nodes.includes(id)) {
      geom.push({ lat: +lat, lng: +lon, id });
    }
  });

  // output.geometry = output.geometry.sort(
  //   (a, b) => nodes.indexOf(a.id) - nodes.indexOf(b.id)
  // );

  output.geometry = nodes
    .map((d) => geom.find((b) => +b.id === +d))
    .filter((d) => d);

  // if (fileName.name.match(/Campus Pool|Portola Dining Commons/)) {
  //   console.log(nodes, output);
  // }
  // console.log(nodes, output);
  console.log(fileName.name, fileName.group);

  const bldg = {
    geometryName: !fileName.name.match(/^_/) ? fileName.name : "",
    goldName: "",
    others: [],
    category:
      fileName.group !== fileName.name &&
      !["food places", "parking lots", "dining halls", "dorms"].includes(
        fileName.group
      )
        ? [fileName.group]
        : [],
  };
  buildingNames.push({ ...bldg, ...goldName });

  geometry.push({
    geometry: output.geometry.map(({ lat, lng }) => ({ lat, lng })),
    name: bldg.geometryName,
    category: goldName
      ? goldName.category
      : ["_" + fileName.group.replace(/ /g, "_")],
  });

  return output;
};

const allFeatures = fs
  .readdirSync("mapbox")
  .filter((d) => !d.match(/_nodes/))
  // .filter((d) => d !== "College of Creative Studies")
  // .filter((d) => d !== "Portola Dining Commons")
  // .filter((d) => d === "Manzanita")
  // .filter((d) => d === "food places")
  // .filter((d) => d === "parking lots")
  // .filter(
  //   (d) =>
  //     d === "dorms" ||
  //     d === "dining halls" ||
  //     d === "University Center" ||
  //     d === "food places"
  // )
  .map((building) => {
    const pth = path.join(__dirname, "mapbox", building);
    if (fs.lstatSync(pth).isDirectory()) {
      return fs
        .readdirSync(pth)
        .filter((d) => !d.match(/_nodes/))
        .map((d) => {
          const pth1 = path.join(pth, d);
          if (fs.lstatSync(pth1).isDirectory()) {
            return fs
              .readdirSync(pth1)
              .filter((b) => !b.match(/_nodes/))
              .map((b) => ({
                name: d,
                path: path.join(pth1, b),
                group: building,
              }));
          }

          return [{ name: d, path: pth1, group: building }];
        })
        .reduce((a, b) => [...a, ...b]);
    }
    return [{ name: building, path: pth, group: building }];
  })
  .reduce((a, b) => [...a, ...b])
  .map((building) => {
    return openFile(building);
  });

const final = convertGEOJSON(allFeatures);
// fs.writeFileSync("../../dist/dormsAndDining.json", JSON.stringify(final));
fs.writeFileSync("../../dist/geometry.json", JSON.stringify(geometry));
fs.writeFileSync(
  "../../dist/buildingNames.json",
  JSON.stringify(buildingNames)
);
