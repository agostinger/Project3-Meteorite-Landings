// Fetch JSON data and create markers
const link = "https://data.nasa.gov/api/views/gh4g-9sfh/rows.json?accessType=DOWNLOAD";

d3.json(link).then((data) => {
  console.log(data);
  // Filter out data points with null latitude or longitude
  let validData = data.data;

  // Step 2: Group data by "recclass" and calculate the sum of "mass_g" and count
  const groupedData = {};
  validData.forEach(item => {
    let recclass = item[11]; // "recclass" field is at index 10
    let mass = parseFloat(item[12]) || 0; // "mass_g" field is at index 11

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

  // Step 3: Sort the data and limit to the top 10 entries for both charts
  const top10TotalMass = bubbleData
    .sort((a, b) => b.totalMass - a.totalMass) // Sort by total mass in descending order
    .slice(0, 10); // Take the top 10 entries

  const top10Count = bubbleData
    .sort((a, b) => b.count - a.count) // Sort by count in descending order
    .slice(0, 10); // Take the top 10 entries

  // Create the "Total Mass" bubble chart
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
    title: 'Top 10 Meteorite Mass by Type',
    xaxis: {
      title: 'Meteorite Type',
      showticklabels: false,
      showgrid: false,
    },
    yaxis: {
      title: 'Total Mass (g)',
      showticklabels: false,
      showgrid: false,
    },
  };

  // Create the "Count by Type" bubble chart
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
    title: 'Top 10 Meteorite Count by Type',
    xaxis: {
      title: 'Meteorite Type',
      showticklabels: false,
      showgrid: false,
    },
    yaxis: {
      title: 'Count',
      showgrid: false,
    },
  };

  // Create both bubble charts
  Plotly.newPlot('bubbleTotalMass', [traceTotalMass], layoutTotalMass);
  Plotly.newPlot('bubbleCount', [traceCount], layoutCount);


// Step 2: Group data by year and calculate the count of meteorites
const groupedDataByYear = {};
validData.forEach(item => {
  // Change this line to correctly extract the year from the date field
  let date = new Date(item[14]); // Assuming the date is at index 14
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

// Step 3: Sort the data by count in descending order
bubbleDataByYear.sort((a, b) => b.count - a.count);

// Step 4: Select the 10th largest count
const tenthLargestCountData = bubbleDataByYear.slice(0, 10);

// Create a Chart.js chart for the count by year
const ctx = document.getElementById('countByYearChart').getContext('2d');

const countByYearData = {
  labels: tenthLargestCountData.map(item => item.year),
  datasets: [{
    label: 'Count',
    data: tenthLargestCountData.map(item => item.count),
    backgroundColor: tenthLargestCountData.map(item => colorScale(item.year)), // Use colorScale for different colors
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
  }],
};

const countByYearOptions = {
  responsive: true,
  maintainAspectRatio: true, // Set to true for responsiveness
  aspectRatio: 2, // Adjust the aspect ratio as needed
  scales: {
    x: {
      title: {
        display: true, // Display the title
        text: 'Year', // Title text
        font: {
          size: 14, // Adjust the font size as needed
          weight: 'bold', // Font weight (e.g., 'bold' for bold)
        },
      },
    },
    y: {
      title: {
        display: true, // Display the title
        text: 'Count', // Title text
        font: {
          size: 14, // Adjust the font size as needed
          weight: 'bold', // Font weight (e.g., 'bold' for bold)
        },
      },
    },
  },
};
new Chart(ctx, {
  type: 'bar', // Use 'bar' type for a bar chart
  data: countByYearData,
});
});
