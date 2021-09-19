import * as d3 from "d3";

const make = (data, selectMap) => {
  const inputBar = d3.select("#laby-camus-map-interactive-auto-complete");
  inputBar.selectAll("*").remove();

  const input = inputBar.append("input");

  const datalist = inputBar
    .append("datalist")
    .attr("id", "labby-campus-map-auto-complete-datalist");

  input.attr("list", "labby-campus-map-auto-complete-datalist");

  const expanded = data
    .map((d) =>
      [...new Set([d.goldName, d.geometryName, ...d.category, ...d.others])]
        .filter((d) => d)
        .map((b) => ({
          val: b,
          geometryName: d.geometryName || d.category[0],
        }))
    )
    .reduce((a, b) => [...a, ...b]);

  const unique = {};

  expanded.forEach((d) => {
    unique[d.val] = d;
  });

  const dlist = Object.values(unique).filter((d) => !d.val.match(/^\_/));

  datalist
    .selectAll("option")
    .data(dlist)
    .enter()
    .append("option")
    .attr("data-value", (d) => d.geometryName)
    .attr("value", (d) => d.val);

  input.on("input", (event) => {
    const val = event.target.value;
    const option = datalist.select(`[value='${val}']`).attr("data-value");

    selectMap(option);
  });

  input.on("click", (event) => {
    event.target.value = "";
  });
};

export default make;
