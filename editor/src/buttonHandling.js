$("#bikePathButton").on("click", () => {
  state.showBikePath = !state.showBikePath;
  d3.selectAll(".bikePathBubble").attr("fill-opacity", state.showBikePath + 0);
  d3.selectAll(".bikePathLink").attr(
    "stroke-width",
    state.showBikePath ? 5 : 0
  );
});

const setButtonGreen = (el, condition) => {
  $(el).css({ "background-color": condition ? "green" : "" });
};

$("#bikePathNodeAddButton").on("click", function () {
  state.addBikePath = !state.addBikePath;
  setButtonGreen(this, state.addBikePath);
});

$("#bikePathNodeDeleteButton").on("click", function () {
  state.deleteBikePath = !state.deleteBikePath;
  setButtonGreen(this, state.deleteBikePath);
});
$("#bikePathLinkAddButton").on("click", function () {
  state.addBikeLink = !state.addBikeLink;
  setButtonGreen(this, state.addBikeLink);
});
$("#bikePathLinkDeleteButton").on("click", function () {
  state.deleteBikeLink = !state.deleteBikeLink;
  setButtonGreen(this, state.deleteBikeLink);
});
$("#bikePathReverseButton").on("click", function () {
  state.reverseBikeLink = !state.reverseBikeLink;
  setButtonGreen(this, state.reverseBikeLink);
});

$("#buildingOutlineButton").on("click", function () {
  state.buildingSelection = !state.buildingSelection;
  data.buildings.push({ geometry: [] });
  setButtonGreen(this, state.buildingSelection);
});

$("#buildingUndoButton").on("click", () => {
  data.buildings[data.buildings.length - 1].geometry.pop();

  if (data.buildings[data.buildings.length - 1].geometry.length === 0) {
    data.buildings.pop();
  }
  update();
});

$("#buildingNameInput").on("input", function () {
  data.buildings[data.buildings.length - 1].name = this.value;
  console.log(data);
});

$("#bikeLotOutlineButton").on("click", function () {
  state.bikeLotSelection = !state.bikeLotSelection;
  if (state.bikeLotSelection) {
    const id = Math.max(...data.bikeLot.map((d) => d.id), 0) + 1;

    data.bikeLot.push({ geometry: [], id });
  }
  setButtonGreen(this, state.bikeLotSelection);
});

$("#bikeLotUndoButton").on("click", () => {
  data.bikeLot[data.bikeLot.length - 1].geometry.pop();

  if (data.bikeLot[data.bikeLot.length - 1].geometry.length === 0) {
    data.bikeLot.pop();
  }
  update();
});

$("#bikeLotEntranceButton").on("click", function () {
  state.bikeLotEntranceSelection = !state.bikeLotEntranceSelection;
  setButtonGreen(this, state.bikeLotEntranceSelection);
});
// starts as green:
$("#bikePathReverseButton").css({ "background-color": "green" });

$("#saveButton").on("click", () => {
  $.ajax({
    type: "POST",
    url: "http://localhost:3330/save",
    data: { data: JSON.stringify(data) },
    success: "yes",
    dataType: "json",
  });
});
