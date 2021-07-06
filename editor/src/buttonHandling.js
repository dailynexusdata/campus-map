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

// starts as green:
$("#bikePathReverseButton").css({ "background-color": "green" });

$("#saveButton").on("click", () => {
  $.ajax({
    type: "POST",
    url: "http://localhost:3330/save",
    data: { data: JSON.stringify(data) },
    success: "yes",
    dataType: "application/json",
  });
});
