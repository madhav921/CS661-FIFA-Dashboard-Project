console.log = () => {}
var globalfilter = {
    'year': 2022
}

const loadData = (year) => {
    if (!year) return;
    globalfilter = {
        'year': window.year || year || 2022
    }
    selectList = []
    selectglist = []
    var url = 'http://127.0.0.1:5005'
    fetch(url + '/fetchdata', {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(globalfilter),
        })
        .then(data => data.json())
        .then(response => {
            var data = JSON.parse(response.data)
            GeoMap(response.geoData, data)
            plotSunBurst(response.sunburst, data)
            BarChart(data, [])
            wordCloud(response.wordcloud)
            PcpChart(response.pcpdata, d3.keys(response.pcpdata[0]))
            setTimeout(() => {
                document.getElementById('wholebody').style.display = 'block'
            }, 1000)
        });
}


window.onload = () => {
    console.log("window loaded")
    loadData(2022);
}

document.getElementById("resetButton").addEventListener("click", (e) => {
    loadData(2022);
    e.stopPropagation();
})
document.getElementById("resetButton2021").addEventListener("click", (e) => {
    loadData(2021);
    e.stopPropagation();
})
document.getElementById("resetButton2020").addEventListener("click", (e) => {
    loadData(2020);
    e.stopPropagation();
})
document.getElementById("resetButton2019").addEventListener("click", (e) => {
    loadData(2019);
    e.stopPropagation();
})
document.getElementById("resetButton2018").addEventListener("click", (e) => {
    loadData(2018);
    e.stopPropagation();
})
document.getElementById("resetButton2017").addEventListener("click", (e) => {
    loadData(2017);
    e.stopPropagation();
})
document.getElementById("resetButton2016").addEventListener("click", (e) => {
    loadData(2016);
    e.stopPropagation();
})
document.getElementById("resetButton2015").addEventListener("click", (e) => {
    loadData(2015);
    e.stopPropagation();
})