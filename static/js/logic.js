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
d3.json('/getdata').then((data) => {
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


// Star Background

(function () {
  /**
     author: @manufosela
     2013/08/27    copyleft 2013
      ShootingStar class Main Methods:
     launch: launch shooting stars every N seconds received by param. 10 seconds by default.
      launchStar: launch a shooting star. Received options object by param with:
               - dir (direction between 0 and 1)
               - life (between 100 and 400)
               - beamSize (between 400 and 700)
               - velocity (between 2 and 10)
  **/


  ShootingStar = function (id) {
    this.n = 0;
    this.m = 0;
    this.defaultOptions = {
      velocity: 8,
      starSize: 10,
      life: 300,
      beamSize: 400,
      dir: -1 };

    this.options = {};
    id = typeof id != "undefined" ? id : "";
    this.capa = $(id).lenght > 0 ? "body" : id;
    this.wW = $(this.capa).innerWidth();
    this.hW = $(this.capa).innerHeight();
  };

  ShootingStar.prototype.addBeamPart = function (x, y) {
    this.n++;
    var name = this.getRandom(100, 1);
    $("#star" + name).remove();
    $(this.capa).append("<div id='star" + name + "'></div>");
    $("#star" + name).append("<div id='haz" + this.n + "' class='haz' style='position:absolute; color:#FF0; width:10px; height:10px; font-weight:bold; font-size:" + this.options.starSize + "px'>·</div>");
    if (this.n > 1) $("#haz" + (this.n - 1)).css({
      color: "rgba(255,255,255,0.5)" });

    $("#haz" + this.n).css({
      top: y + this.n,
      left: x + this.n * this.options.dir });

  };

  ShootingStar.prototype.delTrozoHaz = function () {
    this.m++;
    $("#haz" + this.m).animate({
      opacity: 0 },
    75);
    if (this.m >= this.options.beamSize) {
      $("#ShootingStarParams").fadeOut("slow");
    }
  };

  ShootingStar.prototype.getRandom = function (max, min) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  ShootingStar.prototype.toType = function (obj) {
    if (typeof obj === "undefined") {
      return "undefined"; /* consider: typeof null === object */
    }
    if (obj === null) {
      return "null";
    }
    var type = Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1] || '';
    switch (type) {
      case 'Number':
        if (isNaN(obj)) {
          return "nan";
        } else {
          return "number";
        }
      case 'String':
      case 'Boolean':
      case 'Array':
      case 'Date':
      case 'RegExp':
      case 'Function':
        return type.toLowerCase();}

    if (typeof obj === "object") {
      return "object";
    }
    return undefined;
  };

  ShootingStar.prototype.launchStar = function (options) {
    if (this.toType(options) != "object") {
      options = {};
    }
    this.options = $.extend({}, this.defaultOptions, options);
    this.n = 0;
    this.m = 0;
    var i = 0,
    l = this.options.beamSize,
    x = this.getRandom(this.wW - this.options.beamSize - 100, 100),
    y = this.getRandom(this.hW - this.options.beamSize - 100, 100),
    self = this;
    for (; i < l; i++) {
      setTimeout(function () {
        self.addBeamPart(x, y);
      }, self.options.life + i * self.options.velocity);
    }
    for (i = 0; i < l; i++) {
      setTimeout(function () {
        self.delTrozoHaz();
      }, self.options.beamSize + i * self.options.velocity);
    }
    $("#ShootingStarParams").html("Launching shooting star. PARAMS: wW: " + this.wW + " - hW: " + this.hW + " - life: " + this.options.life + " - beamSize: " + this.options.beamSize + " - velocity: " + this.options.velocity);
    $("#ShootingStarParams").fadeIn("slow");
  };

  ShootingStar.prototype.launch = function (everyTime) {
    if (this.toType(everyTime) != "number") {
      everyTime = 5 ;
    }
    everyTime = everyTime * 1000;
    this.launchStar();
    var self = this;
    setInterval(function () {
      var options = {
        dir: self.getRandom(1, 0) ? 1 : -1,
        life: self.getRandom(400, 100),
        beamSize: self.getRandom(700, 400),
        velocity: self.getRandom(10, 4) };

      self.launchStar(options);
    }, everyTime);
  };

})();

$(document).ready(function() {
  var shootingStarObj = new ShootingStar("body");
  shootingStarObj.launch();
});
