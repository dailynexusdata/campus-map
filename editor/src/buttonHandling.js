const setButtonGreen = (el, condition) => {
  $(el).css({ "background-color": condition ? "green" : "" });
};

$("#bikePathButton").on("click", function () {
  state.showBikePath = !state.showBikePath;
  d3.selectAll(".bikePathBubble").attr("fill-opacity", state.showBikePath + 0);
  d3.selectAll(".bikePathLink").attr(
    "stroke-width",
    state.showBikePath ? 5 : 0
  );
  setButtonGreen(this, state.showBikePath);
});

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
  if (state.buildingSelection) {
    data.buildings.push({ geometry: [] });
  }
  setButtonGreen(this, state.buildingSelection);
});

$("#buildingUndoButton").on("click", () => {
  data.buildings[data.buildings.length - 1].geometry.pop();
  if (
    data.buildings[data.buildings.length - 1].geometry.length === 0 &&
    data.buildings.length > 1
  ) {
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

$("#buildingEntranceButton").on("click", function () {
  state.buildingEntranceSelection = !state.buildingEntranceSelection;
  setButtonGreen(this, state.buildingEntranceSelection);
});

$("#bikeLotExitButton").on("click", function () {
  state.bikeLotExitSelection = !state.bikeLotExitSelection;
  setButtonGreen(this, state.bikeLotExitSelection);
});

// starts as green:
$("#bikePathButton").css({ "background-color": "green" });
$("#bikePathReverseButton").css({ "background-color": "green" });

$("#walkingPathButton")
  .on("click", function () {
    state.showWalkingPath = !state.showWalkingPath;
    d3.selectAll(".walkingPathBubble").attr(
      "fill-opacity",
      state.showWalkingPath + 0
    );
    d3.selectAll(".walkingPathLink").attr(
      "stroke-width",
      state.showWalkingPath ? 5 : 0
    );
    setButtonGreen(this, state.showWalkingPath);
  })
  .css({ "background-color": "green" });

$("#walkingPathNodeAddButton").on("click", function () {
  state.addWalkingPath = !state.addWalkingPath;
  setButtonGreen(this, state.addWalkingPath);
});

$("#walkingPathNodeDeleteButton").on("click", function () {
  state.deleteWalkingPath = !state.deleteWalkingPath;
  setButtonGreen(this, state.deleteWalkingPath);
});
$("#walkingPathLinkAddButton").on("click", function () {
  state.addWalkingLink = !state.addWalkingLink;
  setButtonGreen(this, state.addWalkingLink);
});
$("#walkingPathLinkDeleteButton").on("click", function () {
  state.deleteWalkingLink = !state.deleteWalkingLink;
  setButtonGreen(this, state.deleteWalkingLink);
});
$("#walkingPathReverseButton")
  .on("click", function () {
    state.reverseWalkLink = !state.reverseWalkLink;
    setButtonGreen(this, state.reverseWalkLink);
  })
  .css({ "background-color": "green" });

$("#saveButton").on("click", () => {
  $.ajax({
    type: "POST",
    url: "http://localhost:3330/save",
    data: { data: JSON.stringify(data) },
    success: "yes",
    dataType: "json",
  });
});
