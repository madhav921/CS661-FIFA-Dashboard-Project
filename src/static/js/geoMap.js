// create geoMap svg
  var geo_svg = d3
    .select("#geoMap")
    .append("svg")
    .attr("id", "tempgeo");

  // initial variables
  let width = geo_svg.node().getBoundingClientRect().width;
  let height = geo_svg.node().getBoundingClientRect().height;
  var freq = {};
  var list = [];
  var selectglist = [];

// Map and projection
  
  var projection = d3
    .geoMercator()
    .scale(75)
    .center([0, 10])
    .translate([width / 2, height / 2 + 40]);

// Data and color scale

var geo_tooltip = d3.select("#geoMap")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")

  var geoData;// = JSON.parse(document.getElementById("worldData").innerHTML);

  fetch('http://localhost:5005/geo.json')
      
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          // console.log('response', response.json());
          return response.json();
      })
      .then(data => {
        console.log('read');
          geoData = data;
          // console.log(geoData);
      })
      .catch(error => {
          console.error('There was a problem fetching the data:', error);
      });
  
function GeoMap(frequency) {
  d3.selectAll("#scalegeo").remove();
  geo_tooltip.style("opacity", 0);

  freq = frequency;

  var max = d3.max(Object.values(frequency))
  var list = [0, max/100, max/40, max/20, max/10, max/5, max/4, max/2,max]

  var colorScale = d3
  .scaleThreshold()
  .domain([0, max/100, max/40, max/20, max/10, max/5, max/4, max/2,max])
  .range(d3.schemeGreens[9])

  var linear = d3.scaleQuantile()
  .domain(list)
  .range(d3.schemeGreens[9])

  var svg1 = d3.select("#geoMap").append("svg").attr("id", 'scalegeo');

  svg1.append("g")
  .attr("class", "legendLinear")
  .attr("transform", "translate(80,10)");

  var legendLinear = d3.legendColor()
  .shapeWidth(50)
  .cells(list)
  .orient('horizontal')
  .scale(linear)
  .labelFormat(d3.format(".0f"));

  svg1.select(".legendLinear")
    .call(legendLinear);

  let handleclick = (d) => {
    list.push(d.properties.name);
    globalfilter.nationality = JSON.stringify(list);
    fetch("/fetchdata", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(globalfilter),
    })
      .then((data) => data.json())
      .then((response) => {
        var data = JSON.parse(response.data);
        var maindata = JSON.parse(response.mainData);
        plotSunBurst(response.sunburst, data);
        BarChart(maindata, data);
        PcpChart(response.pcpdata,d3.keys(response.pcpdata[0]))
        wordCloud(response.wordcloud);
      });
    

    d3.selectAll(".Country")
      .filter((d) => list.includes(d.properties.name))
      .transition()
      .duration(200)
      .style("opacity", 1);

    d3.selectAll(".Country")
      .filter((d) => !list.includes(d.properties.name))
      .transition()
      .duration(200)
      .style("opacity", 0.4);
    
  };

  d3.select("#tempgeo").html("");

  
  var zoomG = geo_svg.append("g");
  // Draw the map
  zoomG
    .selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    // draw each country
    .attr("d", d3.geoPath().projection(projection))
    // set the color of each country
    .attr("fill", function (d) {
      var value = frequency[d.properties.name];
      return colorScale(value || 0);
    })
    .style("stroke", "white")
    .attr("class", function (d) {
      return "Country";
    })
    .style("opacity", 0.8)
    .on("click", handleclick)
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave)
    .on("mousemove", function(d) {
      return geo_tooltip
                .style("top", (event.pageY)+"px")
                .style("left",(event.pageX)+"px")
                .html(d.properties.name + "<br>Players: " +
                (frequency[d.properties.name] === undefined ? "None" : frequency[d.properties.name]));
    });

  const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  geo_svg.call(zoom);

  function zoomed() {
    zoomG
      .selectAll("path") // To prevent stroke width from scaling
      .attr("transform", d3.event.transform);
  }
}

// Geo()
let mouseOver = function (d) {
  geo_tooltip.style("opacity", 1);
};

let mouseLeave = function (d) {
  geo_tooltip.style("opacity", 0);
};
