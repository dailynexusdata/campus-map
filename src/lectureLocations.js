import * as d3 from "d3";

const makePlot = (goldData, mapData) => {
  const container = d3.select("#lectureLocations");
  container.selectAll("*").remove();

  const size = {
    height: 400,
    width: Math.min(600, window.innerWidth - 40),
  };

  const hoverArea = container.append("div").style("position", "relative");
  const svg = hoverArea.append("svg");

  // Setup the projection and then translate a lil bit so its not cut off
  const proj = d3
    .geoMercator()
    .fitSize([size.width - 10, size.height], mapData);

  const projection = d3
    .geoMercator()
    .scale(proj.scale())
    .translate([proj.translate()[0] + 5, proj.translate()[1]]);

  const path = d3.geoPath().projection(projection);

  svg.attr("height", size.height).attr("width", size.width);

  const colors = d3.scaleSequential(d3.interpolateBlues);

  const locations = svg.selectAll("buildings").data(mapData.features).join("g");

  // the current selected department is just the first one
  const department = goldData[0];

  locations
    .append("path")
    .attr("d", path)
    .attr("stroke", "black")
    .attr("fill", (d) => {
      const lectureHall = d.properties.name;
      console.log(lectureHall);

      // loc is one of the items in the specific lecture -- may have to change key:
      const lectureData = department.find(
        (loc) => lectureHall === loc.building
      );

      return colors(+lectureData.pct);
    });

  locations
    .append("text")
    .attr("x", (d) => path.centroid(d)[0])
    .attr("y", (d) => path.centroid(d)[1])
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .style("font-size", "14pt")
    .style("font-weight", "bold")
    .text((d, i) => i + "0%");
};

export default makePlot;
