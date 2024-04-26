
var pcaFData= new Set();
var workinprogress = false;

var Axes = {
  'wage_cluster' : {
    name: 'Wage in Euros',
    value: ['0-20000','20001-50000','50001-100000','100001-150000','150001-200000','200001-250000','250001-300000','250001-300000','300000-350000']
  },
  'rating_cluster' : {
    name: 'Rating',
    value: ['0-20','21-30','31-40','41-50','51-60','61-65','66-70','71-75', '76-80', '81-85', '86-90', '91-100']
  },
  'age_cluster' : {
    name: 'Age',
    value: ['11-15','16-20','21-25', '26-30','31-35','36-40','41-50']
  },
  'continent': {
    name: 'Continent',
    value: ['Asia', 'Africa', 'Europe', 'North America', 'South America', 'Oceania']
  },
  'pace_cluster' : {
    name: 'Pace',
    value: ['0-20','21-30','31-40','41-50','51-60','61-65','66-70','71-75', '76-80', '81-85', '86-90', '91-100']
  },
  'dribbling_cluster' : {
    name: 'Dribbling',
    value: ['0-20','21-30','31-40','41-50','51-60','61-65','66-70','71-75', '76-80', '81-85', '86-90', '91-100']
  }
}

var color = {
  '0' : "#5faD56", /* Defence */
  '1' : "#F97068", /* Attacker */
  '2' : "#66C4CF", /* Mid Fielder */
  '3' : "#F2C14E" /* Goal Keeper */
}




function PcpChart(dataPcp,dim){
  d3.selectAll('#pcpchart').remove()
  var pcp_wrap = d3.select('#pcp')
  let width = pcp_wrap.node().getBoundingClientRect().width - 100;
  let height = pcp_wrap.node().getBoundingClientRect().height - 105;
  var margin = {
    top:50,
    right:50,
    bottom:50,
    left:50
  };
 var x = d3.scalePoint().range([0, width], 1),
     y = {},
     dragging = {};

   


 var line = d3.line(),
     axis = d3.axisLeft(),
     background,
     foreground;

 var svg = d3.select("#pcp")
      .append('svg')
      .attr('id', 'pcpchart')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


   // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = dim.filter(function(d) {
     if(d==="sofifa_id" || d === 'pos_type' || d=== 'continent') return false
     y[d] = d3.scalePoint()
     .domain(Axes[d].value)
     .range([height, 0]);
    return true;
}));

   background = svg.append("g")
       .attr("class", "background")
     .selectAll("path")
       .data(dataPcp)
     .enter().append("path")
       .attr("d", linegen);

   foreground = svg.append("g")
       .attr("class", "foreground")
     .selectAll("path")
       .data(dataPcp)
     .enter().append("path")
       .attr("d", linegen)
       .attr("style", function(d) {
           return "stroke:" + color[d.pos_type] + ";";
       });

   // Add a group element for each dimension.
   var g = svg.selectAll(".dimension")
       .data(dimensions)
     .enter().append("g")
       .attr("class", "dimension")
       .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
       .call(d3.drag()
         .subject(function(d) { return {x: x(d)}; })
         .on("start", function(d) {
           dragging[d] = x(d);
         })
         .on("drag", function(d) {
           dragging[d] = Math.min(width, Math.max(0, d3.event.x));
           foreground.attr("d", linegen);
         })
         .on("end", function(d) {
           delete dragging[d];
           transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
           transition(foreground).attr("d", linegen);
         }));



   // Add an axis and title.
   g.append("g")
       .attr("class", "axis")
       .each(function(d) { d3.select(this).call(axis.scale(y[d])); });
   g.append("text")
       .style("text-anchor", "middle")
       .attr("y", -30)
       .text(function(d) {
         return Axes[d].name;
       })
       .attr("font-size", "15px");


   yBrushes = {}
   g.append("g")
     .attr("class", "brush")
     .each(function(d) {
       d3.select(this).call(y[d].brush = d3.brushY().extent([[-10, 0], [10, height]])
       .on("start", brushstart).on("brush", brush));
     })

     function brush() {
       var actives = [];
       //filter brushed extents
       svg.selectAll(".brush")
           .filter(function(d) {
               return d3.brushSelection(this);
           })
           .each(function(d) {
               actives.push({
                   dimension: d,
                   extent: d3.brushSelection(this)
               });
           });
           
       //set un-brushed foreground line disappear
       foreground.classed("fade", function(d,i) {
           var value = !actives.every(function(active) {
               var dim = active.dimension;
               return active.extent[0] <= y[dim](d[dim]) && y[dim](d[dim])  <= active.extent[1];
           });
           if (!value) {
             pcaFData.add(d['sofifa_id'])
           }
           return value;
       });

       if (pcaFData.size == 0) return;
      
        pFeature(Array.from(pcaFData))
      
   }



 function position(d) {
   var v = dragging[d];
   return v == null ? x(d) : v;
 }

 function transition(g) {
   return g.transition().duration(500);
 }

 function linegen(d) {
   return line(dimensions.map(function(p) {  return [position(p), y[p](d[p])]; }));
 }

function brushstart() {
 d3.event.sourceEvent.stopPropagation();
}

}

const pFeature = (slist) => {
  if(slist.length == 0) return;
  globalfilter.pcpval = JSON.stringify(slist)

  workinprogress = true;

  fetch('/fetchdata', {
      method: 'POST', // or 'PUT'
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(globalfilter),
  })
  .then(data => data.json())
  .then(response => {
      var data = JSON.parse(response.data)
      var maindata = JSON.parse(response.mainData)
      GeoMap(response.geoData, data)
      plotSunBurst(response.sunburst, data)
      BarChart(maindata, data)
      wordCloud(response.wordcloud)
      pcaFData = new Set();
      workinprogress = false;

  });
}