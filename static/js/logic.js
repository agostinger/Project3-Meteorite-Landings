// Fetch JSON data and create markers
const link = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD";

// Define functions for setting marker size based on meteroite size
let setSize = (mass) => mass / 500;
const colorScale = d3.scaleOrdinal()
  .domain(["1800-1900", "1901-2000", "2001-2100"]) // Define year range categories
  .range(["#ff0000", "#00ff00", "#0000ff"]); // Define corresponding colors

let createMarker = (feature) => {
  // Extract and parse latitude and longitude values
  let latitude = parseFloat(feature[15]);
  let longitude = parseFloat(feature[16]);

  // Check if latitude and longitude are valid numbers
  if (isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid latitude or longitude:", feature[15], feature[16]);
    return null; // Return null to skip creating a marker for invalid data
  }
  // Extract the date or year information from your data
  let date = new Date(feature[14]); // Replace "date" with the actual property name
  let year = date.getFullYear();

  // Determine the year range based on the year value
  let yearRange = getYearRange(year); // Implement a function to categorize years into ranges

  // Use the color scale to determine the fill color based on the year range
  let fillColor = colorScale(yearRange);
  // Extract other relevant properties for the popup content
  let name = feature[8];
  let mass = feature[12];

  return L.circle([latitude, longitude], {
    color: "black",
    fillColor: fillColor,
    radius: setSize(mass),
    opacity: 1,
    weight: 1,
    fillOpacity: 0.5,
  }).bindPopup(`<strong>Name: </strong> ${name}<br><strong>Mass: </strong> ${mass} grams<br><strong>Year: </strong> ${year} `);
};
function getYearRange(year) {
  if (year >= 1800 && year <= 1900) {
    return "1800-1900";
  } else if (year >= 1901 && year <= 2000) {
    return "1901-2000";
  } else if (year >= 2001 && year <= 2100) {
    return "2001-2100";
  } else {
    return "Unknown"; // Handle cases outside of defined ranges
  }
}
d3.json(link).then((data) => {
  console.log(data);
  // Filter out data points with null latitude or longitude
  let validData = data.data.filter((feature) => {
    let latitude = parseFloat(feature[15]);
    let longitude = parseFloat(feature[16]);
    return !isNaN(latitude) && !isNaN(longitude);
  });
  let markers = validData.map(createMarker);
  createMap(markers);

  // Create the dropdown options
  const meteoroidSelect = document.getElementById("meteoroidSelect");
  validData.forEach((feature) => {
    const name = feature[8];
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    meteoroidSelect.appendChild(option);
  });

  // Add an event listener to the dropdown to update details when an option is selected
  meteoroidSelect.addEventListener("change", () => {
    const selectedName = meteoroidSelect.value;
    const selectedMeteoroid = validData.find((feature) => feature[8] === selectedName);

    if (selectedMeteoroid) {
      // Update the details
      document.getElementById("name").textContent = selectedName;
      document.getElementById("year").textContent = selectedMeteoroid[14];
      document.getElementById("mass").textContent = selectedMeteoroid[12];
      document.getElementById("type").textContent = selectedMeteoroid[11];
    } else {
      // Clear the details if no option is selected
      document.getElementById("name").textContent = "";
      document.getElementById("year").textContent = "";
      document.getElementById("mass").textContent = "";
    }
  });

  // Call createBarChart with valid data
  createBarChart(validData);
});

// Create the base maps
let createMap = (markers) => {
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
  };
  // set the overlay layer
  let overlayMaps = {
    Meteroites: L.layerGroup(markers)
  };
  // set the div to place map and the coordinates of center/zoom level
  let map = L.map("map-container", {
    center: [37.09, -95.71],
    zoom: 4,
    layers: [street, L.layerGroup(markers)]
  });
  // add layers to map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(map);
 // Create the legend
function createLegend() {
  let legend = L.control({ position: 'bottomright' });

  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'legend');
    const yearRanges = ["19th Century", "20th Century", "21st Century"];
// Add a title to the legend
  div.innerHTML = '<h4>Meteorite Landed in:</h4>';

    // Loop through the year ranges and add legend items
    for (const yearRange of yearRanges) {
      const color = colorScale(yearRange); // Get the color for the year range
      div.innerHTML += `<i style="background:${color}"></i> ${yearRange}<br>`;
    }
    // Add the note about circle size
    div.innerHTML += '<p>Circle size represents<br>meteorite mass (grams)</p>';

    return div;
  };

  legend.addTo(map);
}
// Call the createLegend function to add the legend to the map
createLegend(map);
}
// Create the horizontal bar chart
function createBarChart(data) {
  // Extract the top ten meteorites by mass
  const topTenMeteorites = data
    .sort((a, b) => parseFloat(b[12]) - parseFloat(a[12]))
    .slice(0, 10);

  // Extract names and masses for the bar chart
  const meteoriteNames = topTenMeteorites.map((feature) => feature[8]);
  const meteoriteMasses = topTenMeteorites.map((feature) => parseFloat(feature[12]));

  // Create data for the horizontal bar chart
  const barChartData = [
    {
      x: meteoriteMasses.reverse(),
      y: meteoriteNames,
      type: "bar",
      orientation: "h",
      marker: {
      color: "rgb(255, 165, 0)", // Bar fill color
      },
    },
  ];

  const layout = {
    title: "Top Ten Meteorites by Mass",
    xaxis: {
      title: "Mass (grams)",
      rangemode: "tozero",
    },
  };

  // Create the horizontal bar chart using Plotly
  Plotly.newPlot("bar", barChartData, layout);
}
