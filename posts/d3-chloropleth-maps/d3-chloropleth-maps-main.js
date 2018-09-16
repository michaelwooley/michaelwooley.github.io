// Get the SVG
var height = 650,
    width = 960;

var purples11 = ['#f3f2f8', '#e8e7f2', '#dadaeb', '#c6c7e1', '#b2b2d5', '#9e9ac8', '#8a86bf', '#796eb2', '#6950a3', '#5b3495', '#4d1a89']
var greens11 = ['#ebf7e7', '#dbf1d6', '#c7e9c0', '#aedea7', '#92d28f', '#73c476', '#52b365', '#37a055', '#228a44', '#0b7734', '#005f26']

var svg = d3.select("div.sample-div")
            .append('svg')
              .attr('height', height)
              .attr('width', width);

// A mapping from the county fips to the unemployment rate.
// Will be filled in in deferred d3.tsv task below.
var toMap = d3.map();

var path = d3.geoPath();

// A function that returns a color hex given 
// the rate.

var color = d3.scaleThreshold()
    .domain(d3.range(0, 101, 10))
    .range(purples11);

var colorNA = function(value) {
  if (isNaN(value)) {
    return '#D3D3D3'
  } else {
    return color(value)
  }    
}

/****************
Related to Legend
*****************/
var x = d3.scaleLinear()
   .domain([0, 101])
   .rangeRound([height, width]);

var gLegend = svg.append("g")
   .attr("class", "key")
   .attr("transform", "translate(-150,600)");

gLegend.selectAll("rect")
 .data(color.range().map(function(d) {
     d = color.invertExtent(d);
     if (d[0] == null) d[0] = x.domain()[0];
     if (d[1] == null) d[1] = x.domain()[1];
     return d;
   }))
 .enter().append("rect")
   .attr("height", 8)
   .attr("x", function(d) { return x(d[0]); })
   .attr("width", function(d) { return x(d[1]) - x(d[0]); })
   .attr("fill", function(d) { return color(d[0]); });

// gLegend.call(d3.axisBottom(x)
//    .tickSize(13)
//    .tickFormat(function(x, i) { return i ? x : x + "%"; })
//    .tickValues(color.domain()))
//    .select(".domain")
//     .remove();

gLegend.append('text')
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr('x', width-310)
  .attr('dy', '1.95em')
  .style('font-size', '0.5em')
  .text('Low Opioid Prescription Rate');
gLegend.append('text')
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr('x', width-310)
  .attr('dy', '2.85em')
  .style('font-size', '0.5em')
  .text('Small Change in Labor Force Participation Rate');

gLegend.append('text')
        .attr("fill", "#000")
        .attr("text-anchor", "end")
        .attr('x', width-3)
        .attr('dy', '1.95em')
        .style('font-size', '0.5em')
        .text('High Opioid Prescription Rate');
gLegend.append('text')
    .attr("fill", "#000")
    .attr("text-anchor", "end")
    .attr('x', width-3)
    .attr('dy', '2.85em')
    .style('font-size', '0.5em')
    .text('Large Decline in Labor Force Participation Rate');

/***************
Related to Title
****************/

var gTitle = svg.append('g')
                .attr("transform", "translate(200,12)");
gTitle.append('text')
      .attr('class', 'caption')
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .style('caption', 'true')
      .text('Combined Effect of Opioid Prescription Rates and Changes in Labor Force Participation Rate');
gTitle.append('text')
      .attr('class', 'caption')
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr('caption', true)
      .attr('dy', '1em')
      .text('Prime Age Adults, Ages 25-54');


    // g.append("text")
    //    .attr("class", "caption")
    //    .attr("x", x.range()[0])
    //    .attr("y", -6)
    //    .attr("fill", "#000")
    //    .attr("text-anchor", "start")
    //    .attr("font-weight", "bold")
       


/***************************
Loading Data and Plotting It
****************************/
d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json") // Gets the us-state-county path files
    .defer(d3.csv, "data/krueger_data.csv", function(d) { 
        toMap.set('0'.repeat(Math.max(0, 5-d.id.length)) + d.id.toString(), +d.combined_effect); 
    }) // Gets the file with data
    .await(ready); // Once map and data are loaded, carry out ready

function ready(error, us) {
  if (error) throw error;

  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
      .append("path")
      .attr("fill", function(d) { return colorNA(d.combined_effect = toMap.get(d.id)); })
      .attr("d", path)
    .append("title") // Appends what shows up on hover
      .text(function(d) { return d.id + ': ' + d.combined_effect + "%"; });

  // Adds the white outlines around states
  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
}

