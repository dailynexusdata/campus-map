import * as d3 from "d3";

const getLatLng = (map, { lat, lng }) => {
  const ll = new L.latLng(lat, lng);
  return map.latLngToLayerPoint(ll);
};

const addBuildingCircles = (map, svg, buildings) => {
  const buildingsna = buildings.filter((d) => d);

  if (buildingsna.length === 0) {
    return;
  }

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

  const plotData = buildingsna.reduce((a, b) => [...a, ...b]);

  svg
    .selectAll(".buildingArea")
    .data(plotData.filter((d) => d.geometry.length > 1))
    .join(
      (enter) => {
        enter
          .append("path")
          .attr("d", (d) => buildingArea(d.geometry))
          .attr("class", "buildingArea")
          .attr("fill", (d) => {
            return "blue";
            // return colors[
            //   d.category.filter((d) => Object.keys(colors).includes(d))[0]
            // ];
          });
      },
      (update) => {
        update.attr("d", (d) => buildingArea(d.geometry));
      },
      (exit) => exit.remove()
    );

  svg
    .selectAll(".buildingCircleArea")
    .data(plotData.filter((d) => d.geometry.length === 1))
    .join(
      (enter) => {
        enter
          .append("circle")
          .attr("class", "buildingCircleArea")
          .attr("cx", (d) => {
            return getLatLng(map, d.geometry[0]).x;
          })
          .attr("cy", (d) => getLatLng(map, d.geometry[0]).y)
          .attr("fill", (d) => {
            return colors[
              d.category.filter((d) => Object.keys(colors).includes(d))[0]
            ];
          })
          .attr("r", 3);
      },
      (update) => {
        update
          .attr("cx", (d) => {
            return getLatLng(map, d.geometry[0]).x;
          })
          .attr("cy", (d) => getLatLng(map, d.geometry[0]).y);
      },
      (exit) => exit.remove()
    );
};

export default addBuildingCircles;
