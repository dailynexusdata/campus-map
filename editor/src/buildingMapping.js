const addBuildingNode = ({ lat, lng }) => {
  const point = { lat, lng };
  data.buildings[data.buildings.length - 1].geometry.push(point);
  console.log(JSON.stringify(data.buildings[data.buildings.length - 1]));
  addBuildingCircles();
};

const addBuildingCircles = () => {
  console.log(getBuilding({ lat: 34.41226895883256, lng: -119.8572859168053 }));

  const buildingArea = d3
    .line()
    .x((d) => getLatLng(d).x)
    .y((d) => getLatLng(d).y);

  state.svg
    .selectAll(".buildingArea")
    .data(data.buildings)
    .join(
      (enter) => {
        enter
          .append("path")
          .attr("class", "buildingArea")
          .attr("d", (d) => buildingArea(d.geometry))
          .attr("fill", "rgba(255,212,128, 0.2)");
      },
      (update) => {
        update.attr("d", (d) => buildingArea(d.geometry));
      }
    );

  state.svg
    .selectAll(".buildingCircles")
    .data(
      data.buildings.reduce((acc, curr) => {
        return [...acc, ...curr.geometry];
      }, [])
    )
    .join(
      (enter) => {
        enter
          .append("circle")
          .attr("class", "buildingCircles")
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
          .attr("r", 5)
          .attr("fill", "black");
      },
      (update) => {
        update
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y);
      }
    );
};

const getBuilding = (point) => {
  return data.buildings.find(({ geometry }) => inside(point, geometry));
};

const inside = (point, vs) => {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

  var x = point.lat,
    y = point.lng;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i].lat,
      yi = vs[i].lng;
    var xj = vs[j].lat,
      yj = vs[j].lng;

    var intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};
