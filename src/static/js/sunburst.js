let currentDepth = 0;


var url = "http://127.0.0.1:5005";


var positions = {
    "CB": "Center Back",
    "RB": "Right Back",
    "LB": "Left Back",
    "RWB": "Right Winger Back",
    "LWB": "Left Winger Back",

    "CM": "Central Mid Fielder",
    "CDM": "Defensive Mid Fielder",
    "CAM": "Attacking Mid Fielder",
    "RM": "Right Mid Fielder",
    "LM": "Left Mid Fielder",

    "ST": "Striker",
    "CF": "Center Forward",
    "RW": "Right Winger",
    "LW": "Left Winger"
}


var t_positions = {
    "CB": 0,
    "RB": 0,
    "LB": 0,
    "RWB": 0,
    "LWB": 0,

    "CM": 2,
    "CDM": 2,
    "CAM": 2,
    "RM": 2,
    "LM": 2,

    "ST": 1,
    "CF": 1,
    "RW": 1,
    "LW": 1,

    "Gk": 3,

    "Attacker": 1,
    "Mid Fielder": 2,
    "Goal Keeper": 3,
    "Defence": 0,

    "Players": 5
}

var sunburst_tooltip = d3.select("#geoMap")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

function plotSunBurst(root) {
    d3.selectAll("#sunburstplot").remove();
    sunburst_tooltip.style("opacity", 0)

    var wrapper = d3.select("#sunburst")
    let width = wrapper.node().getBoundingClientRect().width - 50;
    let height = wrapper.node().getBoundingClientRect().height - 50;

    const handleClick = (d) => {
        var sequenceArray = getAncestors(d);

        // Fade all the segments.
        d3.selectAll("path.main-arc").style("opacity", 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        svg
            .selectAll("path.main-arc")
            .filter(function(node) {
                return sequenceArray.indexOf(node) >= 0;
            })
            .style("opacity", 1);

        globalfilter.pos = d.data.name + "";

        globalfilter.player_pos = t_positions[d.data.name];

        fetch(url + "/fetchdata", {
                method: "POST", // or 'PUT'
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(globalfilter),
            })
            .then((data) => data.json())
            .then((response) => {
                var data = JSON.parse(response.data);
                var mainData = JSON.parse(response.mainData);
                GeoMap(response.geoData, data);
                BarChart(mainData, data || []);
                PcpChart(response.pcpdata, d3.keys(response.pcpdata[0]))
                wordCloud(response.wordcloud);
            });
    };


    maxRadius = Math.min(width, height) / 2 - 5;
    const formatNumber = d3.format(",d");
    const x = d3
        .scaleLinear()
        .range([0, 2 * Math.PI])
        .clamp(true);
    const y = d3.scaleLinear().range([maxRadius * 0.4, maxRadius]);
    var color = {
        0: "#5fad56",
        /* Defence */
        1: "#F97068",
        /* Attacker */
        2: "#66C4CF",
        /* Mid Fielder */
        3: "#F2C14E" /* Goal Keeper */
    }

    const partition = d3.partition();

    const arc = d3
        .arc()
        .startAngle((d) => x(d.x0))
        .endAngle((d) => x(d.x1))
        .innerRadius((d) => Math.max(0, y(d.y0)))
        .outerRadius((d) => Math.max(0, y(d.y1)));

    const middleArcLine = (d) => {
        const halfPi = Math.PI / 2;
        const angles = [x(d.x0) - halfPi, x(d.x1) - halfPi];
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);

        const middleAngle = (angles[1] + angles[0]) / 2;
        const invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
        if (invertDirection) {
            angles.reverse();
        }

        const path = d3.path();
        path.arc(0, 0, r, angles[0], angles[1], invertDirection);
        return path.toString();
    };

    const textFits = (d) => {
        const CHAR_SPACE = 6;

        const deltaAngle = x(d.x1) - x(d.x0);
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
        const perimeter = r * deltaAngle;

        return d.data.name.length * CHAR_SPACE < perimeter;
    };

    const svg = d3
        .select("#sunburst")
        .append("svg")
        .attr("id", "sunburstplot")
        .style("width", width)
        .style("height", height)
        .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
        .on("click", () => focusOn()); // Reset zoom on canvas click

    root = d3.hierarchy(root);
    root.sum((d) => d.count);

    // d3.select("#percentage")
    // .html("<p>" + root.value + "<br/>" + "Players</p>")
    // .style("color", "#2b193d");


    const slice = svg.selectAll("g.slice").data(partition(root).descendants());
    slice.exit().remove();

    const newSlice = slice
        .enter()
        .append("g")
        .attr("class", "slice")
        .on("click", (d) => handleClick(d))
        .on("mouseover", (d) => mousemove(d))
        .on("mouseleave", (d) => mouseleave(d))
        .on("mousemove", (d) => mousemove(d))

    newSlice
        .append("path")
        .attr("class", "main-arc")
        .style("fill", (d) => d.data.name === "Players" ? '#4A6FA5' : color[t_positions[d.data.name]])
        .attr("d", arc);

    newSlice
        .append("path")
        .attr("class", "hidden-arc")
        .attr("id", (_, i) => `hiddenArc${i}`)
        .attr("d", middleArcLine);

    const text = newSlice
        .append("text")
        .attr("display", (d) => (textFits(d) ? null : "none"));


    text
        .append("textPath")
        .attr("startOffset", "50%")
        .attr("xlink:href", (_, i) => `#hiddenArc${i}`)
        .attr("font-size", "11px")
        .text((d) => d.data.name)
        .style("fill", "white");

    function getAncestors(node) {
        var path = [];
        var current = node;
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }

    function mouseleave(d) {
        sunburst_tooltip.style("opacity", 0)
    }

    function mousemove(d) {
        sunburst_tooltip
            .style("opacity", 1)
            .style("top", (event.pageY) + "px")
            .style("left", (event.pageX) + "px")
            .html((d.data.name in positions ? positions[d.data.name] : d.data.name) + " " + formatNumber(d.value));
    }

}