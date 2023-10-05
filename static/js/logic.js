const link = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD";

const setSize = mass => mass / 500;

const colorScale = d3.scaleOrdinal()
    .domain(["19th Century", "20th Century", "21st Century"])
    .range(["#ff0000", "#00ff00", "#0000ff"]);

const getYearRangeLabel = year => {
    if (year >= 1800 && year <= 1900) return "19th Century";
    if (year >= 1901 && year <= 2000) return "20th Century";
    if (year >= 2001 && year <= 2100) return "21st Century";
    return "Unknown";
};

const createMarker = feature => {
    const [latitude, longitude, date, name, mass] = [feature[15], feature[16], feature[14], feature[8], feature[12]].map(f => parseFloat(f) || f);
    if (!latitude || !longitude) {
        console.error("Invalid latitude or longitude:", feature[15], feature[16]);
        return null;
    }
    const year = new Date(date).getFullYear();
    return L.circle([latitude, longitude], {
        color: "black",
        fillColor: colorScale(getYearRangeLabel(year)),
        radius: setSize(mass),
        opacity: 1,
        weight: 1,
        fillOpacity: 0.5
    }).bindPopup(`<strong>Name: </strong> ${name}<br><strong>Mass: </strong> ${mass} grams<br><strong>Year: </strong> ${year}`);
};

d3.json(link).then(data => {
    const validData = data.data.filter(feature => !isNaN(parseFloat(feature[15])) && !isNaN(parseFloat(feature[16])));
    const markers = validData.map(createMarker);
    createMap(markers);

    const meteoroidSelect = document.getElementById("meteoroidSelect");
    validData.forEach(feature => {
        const option = document.createElement("option");
        option.value = feature[8];
        option.textContent = feature[8];
        meteoroidSelect.appendChild(option);
    });
    meteoroidSelect.addEventListener("change", function() {
        const selectedFeature = validData.find(feature => feature[8] === this.value);
        ["name", "year", "mass", "type"].forEach(id => {
            document.getElementById(id).textContent = selectedFeature ? selectedFeature[["name", "year", "mass", "type"].indexOf(id) + 8] : "";
        });
    });

    createBarChart(validData);
});

function createMap(markers) {
    const layers = {
        "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }),
        "Topographic Map": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        })
    };

    const map = L.map("map-container", {
        center: [37.09, -95.71],
        zoom: 4,
        layers: [layers["Street Map"], L.layerGroup(markers)]
    });

    L.control.layers(layers, { Meteroites: L.layerGroup(markers) }, { collapsed: false }).addTo(map);
    createLegend(map);
}

function createLegend(map) {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = '<h4>Meteorite Landed in:</h4>' + colorScale.domain().map(yearRange => `<i style="background:${colorScale(yearRange)}"></i> ${yearRange}<br>`).join('') + '<p>Circle size represents<br>meteorite mass (grams)</p>';
        return div;
    };
    legend.addTo(map);
}

function createBarChart(data) {
    const topTenMeteorites = data.sort((a, b) => parseFloat(b[12]) - parseFloat(a[12])).slice(0, 10);
    const meteoriteNames = topTenMeteorites.map(feature => feature[8]);
    const meteoriteMasses = topTenMeteorites.map(feature => parseFloat(feature[12]));

    Plotly.newPlot("bar", [{
        x: meteoriteMasses.reverse(),
        y: meteoriteNames.reverse(),
        type: "bar",
        orientation: "h",
        marker: { color: "rgb(255, 165, 0)" }
    }], {
        title: "Top Ten Meteorites by Mass",
        xaxis: { title: "Mass (grams)", rangemode: "tozero" }
    });
}
