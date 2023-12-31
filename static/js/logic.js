// URL for NASA's dataset
const link = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD";

// Function to compute size based on mass
const setSize = mass => Math.sqrt(mass) * 30;


// Initialize a color scale based on year ranges
const colorScale = d3.scaleOrdinal()
  .domain(["1800-1900", "1901-2000", "2001-2100"])
  .range(["#ff0000", "#00ff00", "#0000ff"]);

  // Function to determine which year range a given year falls into
const getYearRange = year => {
  if (year >= 1800 && year <= 1900) return "1800-1900";
  if (year >= 1901 && year <= 2000) return "1901-2000";
  if (year >= 2001 && year <= 2100) return "2001-2100";
  return "Unknown";
};

// Function to create a marker for a given meteoroid feature
const createMarker = feature => {
  const latitude = parseFloat(feature[15]);
  const longitude = parseFloat(feature[16]);

// Check for valid latitude and longitude
  if (isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid latitude or longitude:", feature[15], feature[16]);
    return null;
  }

// Extract year from the feature
  const date = new Date(feature[14]);
  const year = date.getFullYear();
  const yearRange = getYearRange(year);
  const fillColor = colorScale(yearRange);

   // Extract additional meteoroid details
  const name = feature[8];
  const mass = feature[12];

  // Create and return a Leaflet circle marker with a popup for the feature
  return L.circle([latitude, longitude], {
    color: "black",
    fillColor: fillColor,
    radius: setSize(mass),
    opacity: 1,
    weight: 1,
    fillOpacity: 0.5,
  }).bindPopup(`<strong>Name: </strong> ${name}<br><strong>Mass: </strong> ${mass} grams<br><strong>Year: </strong> ${year}`);
};

// Fetch the data and process it
d3.json(link).then(data => {
  // Filter out data with invalid latitude or longitude
  const validData = data.data.filter(feature => {
    const latitude = parseFloat(feature[15]);
    const longitude = parseFloat(feature[16]);
    return !isNaN(latitude) && !isNaN(longitude);
  });

// Create markers for each valid data feature
  const markers = validData.map(createMarker);
  createMap(markers);

  // Populate the meteoroid select dropdown
  const meteoroidSelect = document.getElementById("meteoroidSelect");
  validData.forEach(feature => {
    const option = document.createElement("option");
    option.value = feature[8];
    option.textContent = feature[8];
    meteoroidSelect.appendChild(option);
  });

  // Update displayed details when the selected meteoroid changes
  meteoroidSelect.addEventListener("change", () => {
    const selectedMeteoroid = validData.find(feature => feature[8] === meteoroidSelect.value);

    document.getElementById("name").textContent = selectedMeteoroid ? selectedMeteoroid[8] : "";
    document.getElementById("year").textContent = selectedMeteoroid ? selectedMeteoroid[14] : "";
    document.getElementById("mass").textContent = selectedMeteoroid ? selectedMeteoroid[12] : "";
    document.getElementById("type").textContent = selectedMeteoroid ? selectedMeteoroid[11] : "";
  });

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
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
// Add a title to the legend
  div.innerHTML = '<h4>Meteorite Landed in:</h4>';

// Loop through the year ranges and add legend items
for (let i = 0; i < yearRanges.length; i++) {
  const color = colors[i]; // Get the color for the year range
  const yearRange = yearRanges[i];
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
                color: "rgb(255, 165, 0)",
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
