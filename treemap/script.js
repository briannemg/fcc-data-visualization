// Fetch data from dataUrl
const dataUrl =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";

async function getChartData() {
  const res = await fetch(dataUrl);
  const json = await res.json();
  return json;
}

// Create the tooltip for the chart
function createTooltip() {
  return d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
}

// Create the legend for the chart
function drawLegend(categories, colorScale) {
  const legend = d3
    .select("#treemap-container")
    .append("svg")
    .attr("id", "legend")
    .attr("width", 500)
    .attr("height", 100);

  const itemSize = 20;
  const itemsPerRow = 3;
  const itemSpacingX = 150;
  const itemSpacingY = 30;

  const legendItems = legend
    .selectAll("g")
    .data(categories)
    .enter()
    .append("g")
    .attr("transform", (d, i) => {
      const col = i % itemsPerRow;
      const row = Math.floor(i / itemsPerRow);
      return `translate(${col * itemSpacingX}, ${row * itemSpacingY})`;
    });

  legendItems
    .append("rect")
    .attr("class", "legend-item")
    .attr("width", itemSize)
    .attr("height", itemSize)
    .attr("fill", (d) => colorScale(d));

  legendItems
    .append("text")
    .attr("x", itemSize + 5)
    .attr("y", itemSize - 5)
    .text((d) => d)
    .attr("fill", "#333")
    .style("font-size", "12px")
    .style("font-family", "'Quicksand', sans-serif");
}

// Create the SVG
function createSvgCanvas(width, height) {
  return d3
    .select("#treemap-container")
    .append("svg")
    .attr("id", "treemap")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "90vw")
    .style("height", "auto");
}

// Add the title
function drawTitle(svg, width) {
  svg
    .append("text")
    .attr("id", "title")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text("Movie Sales Treemap");
}

// Add the description
function drawDescription(svg, width) {
  svg
    .append("text")
    .attr("id", "description")
    .attr("x", width / 2)
    .attr("y", 65)
    .attr("text-anchor", "middle")
    .text("Top grossing movies grouped by genre");
}

// Create the treemap hierarchy
function createHierarchy(data) {
  return d3
    .hierarchy(data)
    .sum((d) => Number(d.value) || 0)
    .sort((a, b) => b.value - a.value);
}

// Create the treemap layout
function computeTreemapLayout(root, width, height) {
  d3
    .treemap()
    .size([width, height - 120])
    .padding(1)(root);
}

// Create the treemap category list
function getCategoryList(root) {
  return [...new Set(root.leaves().map((d) => d.data.category.trim()))];
}

// Create the color scale
function createColorScale(categories) {
  return d3.scaleOrdinal().domain(categories).range(d3.schemeCategory10);
}

// Wrap the text in the chart
function wrapText(text, boxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = estimateTextWidth(currentLine + " " + word);
    if (width < boxWidth - 6) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function estimateTextWidth(text, fontSize = 10, fontFamily = "sans-serif") {
  const context = document.createElement("canvas").getContext("2d");
  context.font = `${fontSize}px ${fontFamily}`;
  return context.measureText(text).width;
}

// Draw the tiles
function drawTiles(svg, root, colorScale, tooltip) {
  const tiles = svg
    .selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0 + 80})`);

  tiles
    .append("rect")
    .attr("class", "tile")
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => colorScale(d.data.category.trim()));

  tiles
    .append("text")
    .selectAll("tspan")
    .data((d) => wrapText(d.data.name, d.x1 - d.x0))
    .enter()
    .append("tspan")
    .attr("x", 4)
    .attr("y", (d, i) => 12 + i * 10)
    .text((d) => d)
    .attr("fill", "white")
    .style("font-size", "10px")
    .style("pointer-events", "none");

  tiles
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 0.9)
        .attr("data-value", d.data.value)
        .html(
          `${d.data.name}<br>${
            d.data.category
          }<br>$${d.data.value.toLocaleString()}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}

// Create the chart
function drawChart(data) {
  const width = 1000;
  const height = 600;

  const svg = createSvgCanvas(width, height);

  drawTitle(svg, width);
  drawDescription(svg, width);

  const root = createHierarchy(data);
  computeTreemapLayout(root, width, height);

  const categories = getCategoryList(root);
  const colorScale = createColorScale(categories);
  const tooltip = createTooltip();

  console.log(categories);

  drawTiles(svg, root, colorScale, tooltip);
  drawLegend(categories, colorScale);
}

// Create the chart
getChartData().then(drawChart);
