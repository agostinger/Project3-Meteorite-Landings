// Fetch JSON data and create markers
const link = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD";

d3.json(link).then((data) => {
  console.log(data);
  let validData = data.data;

  // Group data by class type and calculate the sum of the mass and count of meteroites
  const groupedData = {};
  validData.forEach(item => {
    // recclass field is at index 11
    let recclass = item[11];
    // mass field is at index 12
    let mass = parseFloat(item[12]) || 0;

    if (!groupedData[recclass]) {
      groupedData[recclass] = {
        recclass: recclass,
        totalMass: mass,
        count: 1,
      };
    } else {
      groupedData[recclass].totalMass += mass;
      groupedData[recclass].count += 1;
    }
  });

  // Convert grouped data to an array
  const bubbleData = Object.values(groupedData);

  // Sort the data and limit to the top 10 entries for both charts and sort in decending order for top 10
  const top10TotalMass = bubbleData
    .sort((a, b) => b.totalMass - a.totalMass)
    .slice(0, 10);
// Sort by count in descending order for the top 10
  const top10Count = bubbleData
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Create the Total Mass bubble chart
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const traceTotalMass = {
    x: top10TotalMass.map(item => item.recclass),
    y: top10TotalMass.map(item => item.totalMass),
    mode: 'markers+text',
    text: top10TotalMass.map(item => item.recclass),
    marker: {
      size: top10TotalMass.map(item => Math.sqrt(item.totalMass) / 100),
      color: top10TotalMass.map(item => colorScale(item.recclass))
    },
    type: 'scatter',
  };

  const layoutTotalMass = {
    title: 'Top 10 Class Types by Overall Meteorite Mass',
    xaxis: {
      title: 'Meteorite Class Type',
      showticklabels: false,
      showgrid: false,
    },
    yaxis: {
      title: 'Total Mass (g)',
      showticklabels: false,
      showgrid: false,
    },
  };

  // Create the Count by Type bubble chart
  const traceCount = {
    x: top10Count.map(item => item.recclass),
    y: top10Count.map(item => item.count),
    mode: 'markers+text',
    text: top10Count.map(item => item.recclass),
    marker: {
      size: top10Count.map(item => Math.sqrt(item.count)),
      color: top10Count.map(item => colorScale(item.recclass))
    },
    type: 'scatter',
  };

  const layoutCount = {
    title: 'Top 10 Class Types by Number of Meteorite Landings',
    xaxis: {
      title: 'Meteorite Type',
      showticklabels: false,
      showgrid: false,
    },
    yaxis: {
      title: 'Meteorite Landings Count',
      showgrid: false,
    },
  };

  // Create both bubble charts
  Plotly.newPlot('bubbleTotalMass', [traceTotalMass], layoutTotalMass);
  Plotly.newPlot('bubbleCount', [traceCount], layoutCount);


//Group data by year and calculate the count of meteorites
const groupedDataByYear = {};
validData.forEach(item => {
  // Change this line to correctly extract the year from the date field
  let date = new Date(item[14]);
  let year = date.getFullYear();

  if (!groupedDataByYear[year]) {
    groupedDataByYear[year] = {
      year: year,
      count: 1,
    };
  } else {
    groupedDataByYear[year].count += 1;
  }
});

// Convert grouped data to an array
const bubbleDataByYear = Object.values(groupedDataByYear);

//Sort the data by count in descending order
bubbleDataByYear.sort((a, b) => b.count - a.count);

//Select the 10th largest count
const tenthLargestCountData = bubbleDataByYear.slice(0, 10);

// Use the Chart.js library that was not covered in class to create chart for the count by year
  const ctx = document.getElementById('countByYearChart').getContext('2d');

// Formatting
const countByYearData = {
  labels: tenthLargestCountData.map(item => item.year),
  datasets: [{
    label: 'Count',
    data: tenthLargestCountData.map(item => item.count),
    backgroundColor: tenthLargestCountData.map(item => colorScale(item.year)),
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
  }],
};

const countByYearOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Year',
        font: {
          size: 14,
          weight: 'bold',
        },
      },
    },
    y: {
      title: {
        display: true,
        text: 'Count',
        font: {
          size: 14,
          weight: 'bold',
        },
      },
    },
  },
};
new Chart(ctx, {
  type: 'bar',
  data: countByYearData,
});
});
