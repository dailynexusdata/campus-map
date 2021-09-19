import * as d3 from "d3";

const getLatLng = (map, { lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  return map.latLngToLayerPoint(ll);
};

const addBuildingCircles = (map, svg, buildings) => {
  const colors = {
    _lh: "red",
    _student_resources: "blue",
    _other: "green",
    _dorms: "yellow",
    _dining_halls: "magenta",
    _parking_lots: "orange",
  };

  const buildingArea = d3
    .line()
    .x((d) => getLatLng(map, d).x)
    .y((d) => getLatLng(map, d).y);

  console.log(buildings);

  svg
    .selectAll(".buildingArea")
    .data(buildings)
    .join(
      (enter) => {
        enter
          .append("path")
          .attr("class", "buildingArea")
          .attr("d", (d) => buildingArea(d.geometry))
          .attr("fill", (d) => {
            console.log(d);
            return colors[
              d.category.filter((d) => Object.keys(colors).includes(d))[0]
            ];
          });
        //   .attr("fill", "rgba(255,212,128, 0.2)");
      },
      (update) => {
        update.attr("d", (d) => buildingArea(d.geometry));
      }
    );
};

export default addBuildingCircles;
