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
  svg: null,
  buildingSelection: false,
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
    addBuildingCircles();
  }
};
