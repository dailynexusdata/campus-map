const state = {
  mapType: "simple",
  map: null,
  showBikePath: true,
  addBikePath: false,
  deleteBikePath: false,
  addBikeLink: false,
  deleteBikeLink: false,
  overlay: null,
  reverseBikeLink: true,
  reverseWalkLink: true,
  svg: null,
  buildingSelection: false,
  bikeLotSelection: false,
  bikeLotEntranceSelection: false,
  bikeLotExitSelection: false,
  showWalkingPath: true,
  addWalkingPath: false,
  deleteWalkingPath: false,
  addWalkingLink: false,
  deleteWalkingLink: false,
};

let data = null;

$.ajax({
  type: "GET",
  url: "http://localhost:3330/data",
  crossDomain: true,
  dataType: "json",
}).done((res) => {
  data = res;
  setupMap(res);
});

const update = () => {
  if (state.showBikePath) {
    // in bikePathMapping.js
    addBikePathBubbles();
    addBikeLotArea();
  }
  if (state.showWalkingPath) {
    addWalkingPathBubbles();
  }
  addBuildingCircles();
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
