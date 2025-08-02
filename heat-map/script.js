const dataUrl =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

async function getChartData() {
  try {
    const response = await fetch(dataUrl);
    const json = await response.json();

    // Format the data array
    const varData = json.monthlyVariance.map(({ year, month, variance }) => ({
      year: +year,
      monthIndex: month - 1,
      value: variance,
    }));

    // Extract metadata
    const baseTemp = json.baseTemperature;
    const years = varData.map((d) => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    // Return
    return { varData, baseTemp, minYear, maxYear };
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Draw chart
function drawChart(varData, baseTemp, minYear, maxYear) {
  // Set constants
  const margin = { top: 100, right: 30, bottom: 40, left: 60 };
  const fullWidth = 800;
  const fullHeight = 400;
  const innerWidth = fullWidth - margin.left - margin.right;
  const innerHeight = fullHeight - margin.top - margin.bottom;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Create SVG container
  const svg = d3
    .select("#root")
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .attr("id", "chart");

  // Create chart container
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  d3.select("svg")
    .append("text")
    .attr("id", "title")
    .attr("x", fullWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .text("Monthly Global Land-Surface Temperature");

  // Subtitle
  d3.select("svg")
    .append("text")
    .attr("id", "description")
    .attr("x", fullWidth / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#666")
    .text(`${minYear} - ${maxYear} Base Temperature: ${baseTemp}℃`);

  // Set x, y, and color scales
  const years = [...new Set(varData.map((d) => d.year))].sort((a, b) => a - b);
  const xScale = d3.scaleBand().domain(years).range([0, innerWidth]).padding(0);
  const yScale = d3
    .scaleBand()
    .domain(d3.range(0, 12))
    .range([0, innerHeight])
    .padding(0);
  const colorScale = d3
    .scaleQuantize()
    .domain(d3.extent(varData, (d) => baseTemp + d.value))
    .range(["#4575b4", "#91bfdb", "#e0f3f8", "#fee090", "#fc8d59", "#d73027"]);

  // Create axes
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xScale.domain().filter((year) => year % 10 === 0))
    .tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale).tickFormat((month) => months[month]);

  // Add x-axis
  chartGroup
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis);

  // Add x-axis label
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

  // Add y-axis label
  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 15)
    .style("font-size", "12px")
    .style("fill", "#333")
    .text("Month");

  // Create tooltip
  const tooltip = d3
    .select("#root")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none");

  // Add cells
  const cells = chartGroup
    .selectAll(".cell")
    .data(varData)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-month", (d) => d.monthIndex)
    .attr("data-year", (d) => d.year)
    .attr("data-temp", (d) => baseTemp + d.value)
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => {
      const y = yScale(d.monthIndex);
      if (y === undefined) {
        console.warn("Invalid month index:", d.monthIndex);
        return 0; // or some fallback
      }
      return y;
    })
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => colorScale(baseTemp + d.value))
    .on("mouseover", (event, d) => {
      const monthName = months[d.monthIndex];
      const temp = (baseTemp + d.value).toFixed(2);
      tooltip
        .style("opacity", 0.9)
        .html(
          `
        <strong>${d.year} - ${monthName}</strong><br/>
        Temp: ${temp}℃<br/>
        Variance: ${d.value.toFixed(2)}℃
      `
        )
        .attr("data-year", d.year)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 40 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // === LEGEND ===
  const legendColors = colorScale.range();
  const legendWidth = 400;
  const legendHeight = 40;
  const legendRectWidth = legendWidth / legendColors.length;
  const legendX = (fullWidth - legendWidth) / 2;
  const legendY = fullHeight - margin.bottom + 50; // push it down below x-axis label

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${(innerWidth - legendWidth) / 2}, 70)`);

  // Add legend color rectangles and text
  legendColors.forEach((color, i) => {
    const [min, max] = colorScale.invertExtent(color);

    // Color rect
    legend
      .append("rect")
      .attr("x", i * legendRectWidth)
      .attr("y", 0)
      .attr("width", legendRectWidth)
      .attr("height", 15)
      .style("fill", color)
      .style("stroke", "#ccc");

    // Tick label
    legend
      .append("text")
      .attr("x", i * legendRectWidth + legendRectWidth / 2)
      .attr("y", 12)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .text(min.toFixed(1));
  });
}

// Run
getChartData()
  .then((result) => {
    if (!result) {
      console.error("No result returned from getChartData.");
      return;
    }

    const { varData, baseTemp, minYear, maxYear } = result;
    console.log(
      "Data ready for chart:",
      varData.length,
      baseTemp,
      minYear,
      maxYear
    );
    drawChart(varData, baseTemp, minYear, maxYear);
  })
  .catch((error) => {
    console.error("Top-level error:", error);
    console.error("Stack trace:", error.stack);
  });
