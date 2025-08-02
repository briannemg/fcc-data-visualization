const dataUrl =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

async function getChartData() {
  try {
    const response = await fetch(dataUrl);
    const json = await response.json();

    // Format the GDP data array
    const gdpData = json.data.map(([date, value]) => ({
      date: new Date(date),
      value: value,
    }));

    // Extract metadata
    const fromDate = json.from_date;
    const toDate = json.to_date;
    const sourceName = json.source_name;
    const name = json.name.split(",")[0];

    // Return
    return { gdpData, fromDate, toDate, sourceName, name };
  } catch (error) {
    console.error("Error fetching GDP data:", error);
  }
}

// Usage
getChartData().then(({ gdpData, fromDate, toDate, sourceName, name }) => {
  const { titleString, subtitleString } = createTextStrings(
    fromDate,
    toDate,
    name
  );
  drawChart(gdpData, titleString, subtitleString, sourceName);
});

// Create text strings for chart
const createTextStrings = (start, end, title) => {
  const titleString = `United States ${title}`;
  const subtitleString = `from ${start} to ${end}`;
  return { titleString, subtitleString };
};

// Draw chart
const drawChart = (data, titleString, subtitleString, sourceName) => {
  // Set constants
  const margin = { top: 60, right: 30, bottom: 40, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 20)
    .attr("id", "chart")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  d3.select("svg")
    .append("text")
    .attr("id", "title")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .text(titleString);

  // Subtitle
  d3.select("svg")
    .append("text")
    .attr("id", "subtitle")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text(subtitleString);

  // Set x and y scales
  const x = d3
    .scaleTime()
    .domain([d3.min(data, (d) => d.date), d3.max(data, (d) => d.date)])
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .range([height, 0]);

  // Create axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  // Add x-axis
  svg
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  // Source credit
  const sourceText = svg
    .append("text")
    .attr("x", width - 10) // align right of chart area
    .attr("y", height + 40) // bottom of svg
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .style("fill", "#555")
    .text(`Source: ${sourceName}`);

  // Add y-axis
  svg.append("g").attr("id", "y-axis").call(yAxis);

  // Y-axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2) // center vertically
    .attr("y", -margin.left + 15) // position to the left of the axis
    .style("font-size", "12px")
    .style("fill", "#333")
    .text("GDP in Billions of Dollars");

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "#fff")
    .style("padding", "6px")
    .style("border", "1px solid #ccc")
    .style("pointer-events", "none");

  // Bar width
  const barWidth = width / data.length;

  // Add bars
  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.value))
    .attr("width", barWidth)
    .attr("height", (d) => height - y(d.value))
    .attr("fill", "#5f52cc")
    .attr("data-date", (d) => d.date.toISOString().split("T")[0])
    .attr("data-gdp", (d) => d.value)
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);

      tooltip
        .html(
          `Date: ${d.date.toISOString().split("T")[0]}<br>GDP: $${
            d.value
          } Billion`
        )
        .attr("data-date", d.date.toISOString().split("T")[0])
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });
};
