// Data sources
const countyDataUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const eduDataUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

// Fetch data from API
let educationData = [];
let countyFeatures = [];

async function getChartData() {
  try {
    const eduRes = await fetch(eduDataUrl);
    const countyRes = await fetch(countyDataUrl);

    const eduJson = await eduRes.json();
    const countyJson = await countyRes.json();

    educationData = eduJson;
    const counties = topojson.feature(countyJson, countyJson.objects.counties);
    countyFeatures = counties.features;

    return { educationData, countyFeatures };
  } catch (err) {
    console.error("Data loading error:", err);
    return null;
  }
}

// Draw the chart
function drawChart(education, counties) {
  // Set up SVG and dimensions
  const width = 960;
  const height = 675;

  const svg = d3
    .select("#root")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Title
  svg
    .append("text")
    .attr("id", "title")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "2rem")
    .attr("font-weight", "bold")
    .text("United States Educational Attainment");

  // Description
  svg
    .append("text")
    .attr("id", "description")
    .attr("x", width / 2)
    .attr("y", 70)
    .attr("text-anchor", "middle")
    .style("font-size", "0.7rem")
    .text(
      "Percentage of adults age 25 and older with a bachelor's degree or higher (2010–2014)"
    );

  // Create a map of fips -> education data
  const eduMap = new Map(education.map((d) => [d.fips, d]));

  // Create color scale
  const colorScale = d3
    .scaleThreshold()
    .domain([10, 20, 30, 40, 50, 60])
    .range(d3.schemeBlues[7]); // 7 shades of blue

  // Create the tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background-color", "rgba(50, 50, 50, 0.9)")
    .style("color", "white")
    .style("padding", "8px 10px")
    .style("border-radius", "5px")
    .style("font-size", "0.9rem")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Generate the path
  const path = d3.geoPath();

  // Render counties
  const mapGroup = svg.append("g").attr("transform", "translate(0, 25)");

  mapGroup
    .selectAll("path")
    .data(counties)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => eduMap.get(d.id)?.bachelorsOrHigher || 0)
    .attr("fill", (d) => {
      const val = eduMap.get(d.id)?.bachelorsOrHigher || 0;
      return colorScale(val);
    })
    .on("mouseover", function (event, d) {
      const edu = eduMap.get(d.id);

      tooltip
        .style("opacity", 0.9)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`)
        .attr("data-education", edu?.bachelorsOrHigher || 0).html(`
        <strong>${edu?.area_name}, ${edu?.state}</strong><br>
        ${edu?.bachelorsOrHigher}% with bachelor's or higher
      `);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Create legend
  const legendWidth = 300;
  const legendHeight = 10;

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr(
      "transform",
      `translate(${(width - legendWidth) / 2}, ${height - 50})`
    );

  // Create scale for legend axis
  const legendScale = d3
    .scaleLinear()
    .domain([d3.min(colorScale.domain()), d3.max(colorScale.domain())])
    .range([0, legendWidth]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .tickValues(colorScale.domain())
    .tickFormat((d) => `${d}%`);

  // Build legend color boxes
  const legendData = colorScale.range().map((color) => {
    return {
      color,
      extent: colorScale.invertExtent(color),
    };
  });

  const legendItemWidth = legendWidth / legendData.length;

  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * legendItemWidth)
    .attr("y", 0)
    .attr("width", legendItemWidth)
    .attr("height", legendHeight)
    .attr("fill", (d) => d.color);

  legend
    .append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  // Source
  svg
    .append("a")
    .attr(
      "xlink:href",
      "https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx"
    )
    .attr("target", "_blank")
    .append("text")
    .attr("x", width - 10)
    .attr("y", height - 10)
    .attr("text-anchor", "end")
    .style("font-size", "0.7rem")
    .style("fill", "#555")
    .style("text-decoration", "underline")
    .text("Source: USDA Economic Research Service");
}

// Run it all
async function init() {
  const data = await getChartData();
  if (data) {
    drawChart(data.educationData, data.countyFeatures);
  }
}

init();
