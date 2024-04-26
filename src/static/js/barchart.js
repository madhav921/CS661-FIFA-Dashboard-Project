var x, y;
var selectList = [];
var otherlist = [];

var bar_tooltip = d3
    .select("#barchart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("color", "black")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

const sFeature = (d) => {
    const index = selectList.indexOf(d.name);
    if (d.name == "Other_leagues") {
        var contains = false;
        otherlist.forEach(d => {
            if (selectList.indexOf(d) > -1) {
                selectList.splice(selectList.indexOf(d), 1)
                contains = true;
            }
        })
        if (!contains) {
            selectList = [...selectList, ...otherlist]
        }
    } else {
        if (index > -1) {
            selectList.splice(index, 1);
        } else {
            selectList.push(d.name);
        }
    }

    if (selectList.length != 0) {
        globalfilter.value = JSON.stringify(selectList);
    }

    d3.selectAll('.barrect').filter(d => {
        return selectList.indexOf(d.name) > -1
    }).style('opacity', 1)

    d3.selectAll('.barrect').filter(d => selectList.indexOf(d.name) < 0).style('opacity', 0.5)


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
            GeoMap(response.geoData, data);
            plotSunBurst(response.sunburst, data);
            PcpChart(response.pcpdata, d3.keys(response.pcpdata[0]));
            wordCloud(response.wordcloud);
        });

};

const BarChart = (totaldata, filterdata = []) => {
    d3.selectAll("#svgbar").remove();
    bar_tooltip.style("opacity", 0)

    var color = {
        0: "#5fad56",
        /* Defence */
        1: "#F97068",
        /* Attacker */
        2: "#66C4CF",
        /* Mid Fielder */
        3: "#F2C14E" /* Goal Keeper */
    }

    var mycolor = 'rgb(74, 111, 165)'
    if (globalfilter.player_pos < 4) {
        mycolor = color[globalfilter.player_pos];
    }

    console.log(totaldata, filterdata);

    var wrapper = d3.select("#barchart");
    let Twidth = wrapper.node().getBoundingClientRect().width - 50;
    let Theight = wrapper.node().getBoundingClientRect().height - 100;

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 0, bottom: 0, left: 150 },
        width = Twidth - margin.left - margin.right,
        height = Theight - margin.top - margin.bottom;


    var svg = d3.select("#barchart")
        .append("svg")
        .attr("id", "svgbar")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    var map = new Map();
    var value = 'final_league'
    totaldata.map((node) => {
        map.set(node[value], (map.get(node[value]) || 0) + 1);
    });
    var data = Array.from(map, ([name, value]) => ({ name, value }));
    data.sort((a, b) => b.value - a.value)

    var othercount = 0;
    otherlist = []
    for (let i = 28; i < data.length; i++) {
        otherlist.push(data[i].name);
        othercount += data[i].value;
    }

    data.length = 28;
    data.push({
        'name': 'Other_leagues',
        'value': othercount
    });
    data.sort((a, b) => b.value - a.value)


    var map2 = new Map();
    filterdata.map(node => {
        map2.set(node[value], (map2.get(node[value]) || 0) + 1);
    })

    var sum = 0;
    otherlist.forEach(v => {
        sum += map2.get(v)
    })
    map2.set("Other_leagues", sum)

    // Add X axis
    x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.value; })])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .attr("fill", "white");

    // Y axis
    y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(function(d) { return d.name; }))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .attr("fill", "white");


    //Bars
    svg.selectAll("myRect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", 'barrect')
        .attr("x", () => { return x(0) })
        .attr("y", function(d) { return y(d.name); })
        .attr("width", function(d) { return x(d.value); })
        .attr("height", y.bandwidth())
        .attr("fill", "#8da7be")

    .on("click", (d) => {
            sFeature(d)
        }).on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseOver);

    if (filterdata.length > 0) {
        svg.selectAll("myRect2")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", () => { return x(0) })
            .attr("y", function(d) { return y(d.name); })
            .attr("width", 0)
            .attr("height", y.bandwidth())
            .transition()
            // .duration(1000)
            .attr("width", function(d) { return x(map2.get(d.name) || 0); })
            .attr("fill", mycolor)
    }



    function mouseOver(d) {
        if (filterdata.length > 0){
            bar_tooltip
            .style("opacity", 1)
            .style("top", (event.pageY) + "px")
            .style("left", (event.pageX) + "px")
            .style("color", "black")
            .html(d.name + " : " + (map2.get(d.name) || 0));
        }
        else{
        bar_tooltip
            .style("opacity", 1)
            .style("top", (event.pageY) + "px")
            .style("left", (event.pageX) + "px")
            .style("color", "black")
            .html(d.name + " : " + d.value);
        }
    };

    function mouseLeave(d) {
        bar_tooltip.style("opacity", 0);
    };

}