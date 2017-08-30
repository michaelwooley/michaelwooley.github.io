/**********
    SETUP
**********/
var h = 250,
  w = 250;
var svg = d3.select('.sample-div')
  .append('svg')
  .attr('height', h)
  .attr('width', w)
  .attr('class', 'display-svg');
// Border Rectangle
svg.append('rect')
  .attr('height', h)
  .attr('width', w)
  .attr('stroke', 'black')
  .attr('stroke-width', 4)
  .attr('opacity', 0.25)
  .attr('fill-opacity', 0.0)
  .attr('class', 'border-rect');

svg.append('text')
	.attr('x', 5)
	.attr('y', 20)
  .style('font-family', "sans-serif")
  .style('font-size', 12)
	.text('Click and drag to draw a rectangle.')
  ;

/**************
 ADD RECTANGLE
**************/
var addRect = (function() {
  // A module for adding svg rectangles to the canvas.

  // Common variables to draw on (Private/Not exposed to public calls)
  var x0, y0; // Initial points clicked.
  var r; // Rectangle object modified by each function

  var start = function() {
    // What to do on mousedown
    // 1. Get mouse location in SVG
    var m = d3.mouse(this);
    x0 = m[0], y0 = m[1];
    // 2. Make a rectangle
    r = svg.append('rect') // An SVG `rect` element
      .attr('x', x0) // Position at mouse location
      .attr('y', y0)
      .attr('width', 1) // Make it tiny
      .attr('height', 1)
      .attr('class', 'rect') // Assign a class for formatting purposes
    ;
  }

  var drag = function() {
    // What to do when mouse is dragged
    // 1. Get the new mouse position
    var m = d3.mouse(this);
    // 2. Update the attributes of the rectangle
    r.attr('x', Math.min(x0, m[0]))
      .attr('y', Math.min(y0, m[1]))
      .attr('width', Math.abs(x0 - m[0]))
      .attr('height', Math.abs(y0 - m[1]));
  }

  var end = function() {
    // What to do on mouseup

    console.log(r.node().getBBox());
  }

  // Exposed to public calls
  return {
    start: start,
    drag: drag,
    end: end,
  };

})();

svg.call(
  d3.drag()
  .on('start', addRect.start)
  .on('drag', addRect.drag)
  .on('end', addRect.end)
);
