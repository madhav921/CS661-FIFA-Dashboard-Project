var slist = [];
const selectData = (list) => {

    if (list.length == 0) {
        delete globalfilter['wfilter']
    } else {
        globalfilter.wfilter = JSON.stringify(list)
    }
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

        });
};

function wordCloud(data) {
    var myWords = data
    d3.selectAll("#wordcloudplot").remove()
    var min = d3.min(myWords.map((d) => d.count));
    var max = d3.max(myWords.map((d) => d.count));
    myWords.length = Math.min(100, myWords.length)
    for (var i = 0; i < myWords.length; i++) {
        if (max != min)
            myWords[i].count = Math.pow(((myWords[i].count - min) / (max - min)), 2) * 30;
        else
            myWords[i].count = 1 * 20;
    }

    var color = {
        0: "#5fad56",
        /* Defence */
        1: "#F97068",
        /* Attacker */
        2: "#66C4CF",
        /* Mid Fielder */
        3: "#F2C14E" /* Goal Keeper */
    }

    var wordcloud_tooltip = d3.select("#geoMap")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("color", "black")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    var wordcloud = d3.select('#wordcloud')
    let width = wordcloud.node().getBoundingClientRect().width;
    let height = wordcloud.node().getBoundingClientRect().height - 40;

    var margin = { top: 10, right: 10, bottom: 10, left: 10 };

    // append the svg object to the body of the page
    var word_svg = d3
        .select("#wordcloud")
        .append("svg")
        .attr("id", "wordcloudplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + -margin.left + "," + margin.top + ")");

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    // Wordcloud features that are different from one word to the other must be here
    var layout = d3.layout
        .cloud()
        .size([width, height])
        .words(
            myWords.map(function(d) {
                return { text: d.name, size: d.count, pos: d.pos };
            })
        )
        .padding(2) //space between words
        .rotate(function() {
            return ~~(Math.random() * 2) * 90;
        })
        .fontSize(function(d) {
            return d.size + "";
        })
        .on("end", draw);
    layout.start();

    // This function takes the output of 'layout' above and draw the words
    // Wordcloud features that are THE SAME from one word to the other can be here
    function draw(words) {
        wordcloud_tooltip.style("opacity", 0);

        var mydict = word_svg
            .append("g")
            .attr(
                "transform",
                "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")"
            )
            .selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .attr("class", "wtext")
            .attr("font-size", "0px")
            .attr("font-size", function(d) {
                return d.size + "";
            })
            .style("fill", function(d) {
                return color[d.pos];
            })
            .attr("text-anchor", "middle")
            .style("font-family", "Impact")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) {
                return d.text;
            })
        mydict.on("click", handleClick)
    }

    function handleClick(d) {
        if (slist.indexOf(d.text) > -1) {
            slist.splice(slist.indexOf(d.text), 1);
        } else {
            slist.push(d.text);
        }
        d3.selectAll(".wtext").style("opacity", 0.2)

        if (slist.length != 0) {
            d3.selectAll(".wtext").filter(c => slist.indexOf(c.text) > -1).style("opacity", 1)
            selectData(slist)
        } else {
            d3.selectAll(".wtext").style("opacity", 1)
            selectData(slist)

        }

    }
}