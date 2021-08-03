let currentLink = { source: -1, target: -1, type: "bikepath" };

const addBikePathLink = (id) => {
  if (currentLink.source === -1) {
    // set source on first function call
    currentLink.source = id;
  } else if (currentLink.source !== id) {
    // set target on second function call
    currentLink.target = id;

    // get the two nodes and calculate distance between
    const p1 = data.bikePath.nodes.find(({ id }) => id === currentLink.source);
    const p2 = data.bikePath.nodes.find(({ id }) => id === currentLink.target);
    currentLink.distance = distance(p1, p2);

    // store the link
    data.bikePath.links.push(currentLink);

    if (state.reverseBikeLink) {
      // if reverseBikeLink Button is green then,
      // copy the link object
      const reversed = { ...currentLink };

      // swap the source and targe
      [reversed.source, reversed.target] = [reversed.target, reversed.source];

      // append this other direction
      data.bikePath.links.push(reversed);
    }

    // reset the link
    currentLink = { source: -1, target: -1, type: "bikepath" };
  }
};

const addBikePathNode = ({ lat, lng }) => {
  // the new id is +1 the biggest of all other ids
  const id =
    Math.max(
      ...data.bikePath.nodes.map((d) => (d.hasOwnProperty("id") ? d.id : 0)),
      0
    ) + 1;

  data.bikePath.nodes.push({ lat, lng, id });
};

const bikePathLine = d3
  .line()
  .x((d) => getLatLng(d).x)
  .y((d) => getLatLng(d).y);

const addBikePathBubbles = () => {
  state.svg
    .selectAll(".bikePathBubble")
    .data(data.bikePath.nodes)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "bikePathBubble")
          .attr("cx", (d) => getLatLng(d).x)
          .attr("cy", (d) => getLatLng(d).y)
          .attr("r", 7)
          .attr("pointer-events", "visible") // we need this to be able to click through the map
          .style("fill", "red")
          .on("click", function (event, d) {
            if (state.deleteBikePath) {
              // deleting node
              // filter out all of the nodes with this id:
              data.bikePath.nodes = data.bikePath.nodes.filter(
                ({ id }) => id !== d.id
              );
            } else if (state.addBikeLink) {
              // adding link
              // make this circle flash green to signify a successful click
              d3.select(this)
                .style("fill", "green")
                .transition()
                .duration(1000)
                .style("fill", "red");

              addBikePathLink(selectedId);
            } else if (state.bikeLotEntranceSelection) {
              const [insideLot, insideLotPos] = getBikePathInside(d);
              if (insideLot) {
                data.bikeLot[insideLotPos].entrance = d.id;
                d.bikePath = insideLot.id;
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
    .selectAll(".bikePathLink")
    .data(data.bikePath.links)
    .join(
      (enter) =>
        enter
          .append("line")
          .attr("class", "bikePathLink")
          .attr("x1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).y;
          })
          .attr("stroke-width", 5)
          .attr("stroke", "#89CFF0")
          .attr("pointer-events", "visible")
          .attr("fill", "red")
          .lower() // put under the circles
          .on("click", (event, { source, target }) => {
            if (state.deleteBikeLink) {
              data.bikePath.links = data.bikePath.links.filter(
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
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).x;
          })
          .attr("y1", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.source);
            return getLatLng(point).y;
          })
          .attr("x2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).x;
          })
          .attr("y2", (d) => {
            const point = data.bikePath.nodes.find(({ id }) => id === d.target);
            return getLatLng(point).y;
          })
    );
};

const getBikePathInside = (point) => {
  let pos = -1;
  const p1 = data.bikeLot.find(({ geometry }, i) => {
    pos = i;
    return inside(point, geometry);
  });
  return [p1, pos];
};

// theres got to be a better way to get the nodes than this...

const addBikeLotNode = ({ lat, lng }) => {
  const point = { lat, lng };
  data.bikeLot[data.bikeLot.length - 1].geometry.push(point);
  // console.log(JSON.stringify(data.bikeLot[data.bikeLot.length - 1]));
  addBikeLotArea();
};

const addBikeLotArea = () => {
  const buildingArea = d3
    .line()
    .x((d) => getLatLng(d).x)
    .y((d) => getLatLng(d).y);

  // console.log(data.bikeLot);

  state.svg
    .selectAll(".bikeLotArea")
    .data(data.bikeLot)
    .join(
      (enter) => {
        enter
          .append("path")
          .attr("class", "bikeLotArea")
          .attr("d", (d) => buildingArea(d.geometry))
          .attr("fill", "rgba(144,238,144,0.2)");
      },
      (update) => {
        update.attr("d", (d) => buildingArea(d.geometry));
      }
    );

  state.svg
    .selectAll(".bikeLotCircles")
    .data(
      data.bikeLot.reduce((acc, curr) => {
        return [...acc, ...curr.geometry];
      }, [])
    )
    .join(
      (enter) => {
        enter
          .append("circle")
          .attr("class", "bikeLotCircles")
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
