let currentWalkingLink = { source: -1, target: -1, type: "walkingPath" };

const addWalkingPathLink = (id) => {
  if (currentWalkingLink.source === -1) {
    // set source on first function call
    currentWalkingLink.source = id;
  } else if (currentWalkingLink.source !== id) {
    // set target on second function call
    currentWalkingLink.target = id;

    // get the two nodes and calculate distance between
    const p1 = data.walkingPath.nodes.find(
      ({ id }) => id === currentWalkingLink.source
    );
    const p2 = data.walkingPath.nodes.find(
      ({ id }) => id === currentWalkingLink.target
    );
    currentWalkingLink.distance = distance(p1, p2);

    // store the link
    data.walkingPath.links.push(currentWalkingLink);

    if (state.reverseBikeLink) {
      // if reverseBikeLink Button is green then,
      // copy the link object
      const reversed = { ...currentWalkingLink };

      // swap the source and targe
      [reversed.source, reversed.target] = [reversed.target, reversed.source];

      // append this other direction
      data.walkingPath.links.push(reversed);
    }

    // reset the link
    currentWalkingLink = { source: -1, target: -1, type: "walkingPath" };
  }
};

const addWalkingPathNode = ({ lat, lng }) => {
  // the new id is +1 the biggest of all other ids
  const id =
    Math.max(
      ...data.walkingPath.nodes.map((d) => (d.hasOwnProperty("id") ? d.id : 0)),
      0
    ) + 1;

  const nde = { lat, lng, id };

  const building = getBuilding({ lat, lng });
  if (building) {
    nde["building"] = building.name;
  }

  const bikeLot = getBikePathInside({ lat, lng })[0];
  if (bikeLot) {
    nde["bikeLot"] = bikeLot.id;
  }
  console.log(nde);
  data.walkingPath.nodes.push(nde);
};

const getBuildingInside = (point) => {
  let pos = -1;
  const p1 = data.buildings.find(({ geometry }, i) => {
    pos = i;
    return inside(point, geometry);
  });
  return [p1, pos];
};

const walkingPathLine = d3
  .line()
  .x((d) => getLatLng(d).x)
  .y((d) => getLatLng(d).y);

const addWalkingPathBubbles = () => {
  state.svg
    .selectAll(".walkingPathBubble")
    .data(data.walkingPath.nodes)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "walkingPathBubble")
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
          .attr("r", 7)
          .attr("pointer-events", "visible") // we need this to be able to click through the map
          .style("fill", "purple")
          .on("click", function (event, d) {
            if (state.deleteWalkingPath) {
              // deleting node
              // filter out all of the nodes with this id:
              data.walkingPath.nodes = data.walkingPath.nodes.filter(
                ({ id }) => id !== d.id
              );
            } else if (state.addWalkingLink) {
              // adding link
              // make this circle flash green to signify a successful click
              d3.select(this)
                .style("fill", "green")
                .transition()
                .duration(1000)
                .style("fill", "purple");

              addWalkingPathLink(d.id);
            } else if (state.bikeLotExitSelection) {
              const [insideLot, insideLotPos] = getBikePathInside(d);
              if (insideLot) {
                data.bikeLot[insideLotPos].exit = d.id;
                d.bikeLot = insideLot.id;
                console.log("Successfully selected lot!");
              } else {
                alert("node is not inside a bikepath lot!");
              }
            } else if (state.buildingEntranceSelection) {
              const [insideLot, insideLotPos] = getBuildingInside(d);
              if (insideLot) {
                data.buildings[insideLotPos].entrance = d.id;
                d.building = insideLot.id;
                console.log("Successfully selected lot!");
              } else {
                alert("node is not inside a bikepath lot!");
              }
            }
            update();
          }),
      // on update, recalculate the x,y location of each point
      (update) =>
        update
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
    );

  state.svg
    .selectAll(".walkingPathLink")
    .data(data.walkingPath.links)
    .join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "walkingPathLink")
          .attr("x1", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.source
            );
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.source
            );
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.target
            );
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.target
            );
            return getLatLng(point).y;
          })
          .attr("stroke-width", 5)
          .attr("stroke", "#FFD580")
          .attr("pointer-events", "visible")
          .lower() // put under the circles
          .on("click", (event, { source, target }) => {
            if (state.deleteWalkingLink) {
              data.walkingPath.links = data.walkingPath.links.filter(
                ({ source: s1, target: t1 }) => {
                  return source !== s1 || target !== t1;
                }
              );
            }
            update();
          }),
      (update) =>
        update
          .attr("x1", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.source
            );
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.source
            );
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.target
            );
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.walkingPath.nodes.find(
              ({ id }) => id === d.target
            );
            return getLatLng(point).y;
          })
    );
};
