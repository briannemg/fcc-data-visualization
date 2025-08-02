const dataUrl =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";

let cyclistData = [];

async function getChartData() {
  try {
    const response = await fetch(dataUrl);
    const json = await response.json();
    cyclistData = json.map((d) => ({ ...d }));
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Draw chart
const drawChart = (data) => {
  // Set constants
  const margin = { top: 60, right: 30, bottom: 40, left: 60 };
  const fullWidth = 800;
  const fullHeight = 400;
  const innerWidth = fullWidth - margin.left - margin.right;
  const innerHeight = fullHeight - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight + 20)
    .attr("id", "chart");

  // Create chart container
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Title
  d3.select("svg")
    .append("text")
    .attr("id", "title")
    .attr("x", fullWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .text("Doping in Professional Bicycle Racing");

  // Subtitle
  d3.select("svg")
    .append("text")
    .attr("id", "subtitle")
    .attr("x", fullWidth / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text("35 Fastest times up Alpe d'Huez");

  // Set x and y scales
  const x = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.Year - 1), d3.max(data, (d) => d.Year + 1)])
    .range([0, innerWidth - 5]);

  const y = d3
    .scaleLinear()
    .domain([d3.max(data, (d) => d.Seconds), d3.min(data, (d) => d.Seconds)])
    .range([innerHeight, 0]);

  function formatSecondsToTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Create axes
  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));

  const yAxis = d3.axisLeft(y).tickFormat(formatSecondsToTime);

  // Add x-axis
  chartGroup
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  // x-axis label
  chartGroup
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 35)
    .style("font-size", "12px")
    .text("Year");

  // Add y-axis
  chartGroup.append("g").attr("id", "y-axis").call(yAxis);

  // y-axis label
  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -innerHeight / 2) // center vertically
    .attr("y", -margin.left + 15) // position to the left of the axis
    .style("font-size", "12px")
    .style("fill", "#333")
    .text("Time in Minutes");

  // Create tooltip
  const tooltip = d3.select("body").append("div").attr("id", "tooltip");

  // Add data point circles
  chartGroup
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.Year))
    .attr("cy", (d) => y(d.Seconds))
    .attr("r", 5)
    .attr("fill", (d) => (d.Doping ? "#d94f4f" : "#1e90ff"))
    .attr("data-xvalue", (d) => d.Year)
    .attr("data-yvalue", (d) => {
      const date = new Date(0);
      date.setSeconds(d.Seconds);
      return date.toISOString();
    })
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .attr("data-year", d.Year).html(`
          <strong>${d.Name}</strong> (${d.Nationality})<br>
          Year: ${d.Year}, Time: ${d.Time}<br>
          ${d.Doping ? `<em>${d.Doping}</em>` : "No doping allegations"}
        `);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Legend container
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${fullWidth - margin.right - 150}, ${margin.top})`
    );

  // Legend data
  const legendData = [
    { color: "#d94f4f", text: "Doping allegations" },
    { color: "#1e90ff", text: "No doping allegations" },
  ];

  // Legend items
  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d) => d.color);

  legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", (d, i) => i * 25 + 14)
    .style("font-size", "12px")
    .text((d) => d.text);
};

// Usage
async function init() {
  await getChartData();
  console.log(cyclistData);
  drawChart(cyclistData);
}

init();
