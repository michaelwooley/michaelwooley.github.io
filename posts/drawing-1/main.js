function SVGCanvas(options) {
  /*
   *  An SVG-based drawing app.
   *  Input: 
   *   - options: An object consisting of:
   *    - h: The height of the canvas (default: 250px).
   *    - w: The width of the canvas (default: 250px).
   *    - addTo: CSS Selector for element on which to add canvas (default: 'body').
   *    - addBorderRect: (bool) Add a border around the canvas (default: true).
   *  Returns: An SVG object contained in the `addTo` DOM element.
  */ 
  var self = this;
  // Define the global SVG options
  this.options = options || {};
  this.options.h = options.h || 250; 
  this.options.w = options.w || 250;
  this.options.addTo = options.addTo || 'body'; 
  this.options.addBorderRect = options.addBorderRect || true;
  
  // Canvas
  //// Make the main container SVG 
  this.svg = d3.select(this.options.addTo)
    .append('svg')
    .attr('height', this.options.h)
    .attr('width', this.options.w)
    .attr('class', 'display-svg');
  //// Add border if requested
  if (this.options.addBorderRect) {
    this.svg.append('rect')
      .attr('height', this.options.h)
      .attr('width', this.options.w)
      .attr('stroke', 'black')
      .attr('stroke-width', 4)
      .attr('opacity', 0.25)
      .attr('fill-opacity', 0.0)
      .attr('class', 'border-rect');
  }
  // Rectangles
  this.Rect = { // Current Selection
    'r': null,
    'x0': null,
    'y0': null,
  };
  this.Shapes = []; // Collection
  // Actions/Listeners
  this.makeAddRect(); // Methods for adding rectangles
  // On drag: call addRect methods
  this.svg.call(
    d3.drag()
    .on('start', this.addRect.start)
    .on('drag', this.addRect.drag)
    .on('end', this.addRect.end)
  );
}

SVGCanvas.prototype.mouseOffset = function() {
  // Get the current location of mouse along with other info (to be added to later)
  var m = d3.event;
  return m;
}

SVGCanvas.prototype.makeAddRect = function() {
  // Methods for adding rectangles to the svg.
  var self = this;
  start = function() {
    //Add a rectangle
    // 1. Get mouse location in SVG
    var m = self.mouseOffset();
    self.Rect.x0 = m.x;
    self.Rect.y0 = m.y;
    // 2. Make a rectangle
    self.Rect.r = self.svg //self.zoomG
      .append('g')
      .append('rect') // An SVG `rect` element
      .attr('x', self.Rect.x0) // Position at mouse location
      .attr('y', self.Rect.y0)
      .attr('width', 1) // Make it tiny
      .attr('height', 1)
      .attr('class', 'rect-main') // Assign a class for formatting purposes
    ;
  }
  drag = function() {
    // What to do when mouse is dragged
    // 1. Get the new mouse position
    var m = self.mouseOffset();
    // 2. Update the attributes of the rectangle
    self.Rect.r.attr('x', Math.min(self.Rect.x0, m.x))
      .attr('y', Math.min(self.Rect.y0, m.y))
      .attr('width', Math.abs(self.Rect.x0 - m.x))
      .attr('height', Math.abs(self.Rect.y0 - m.y));
  }
  end = function() {
    // What to do on mouseup
    self.Shapes.push(self.Rect);
  }
  
  self.addRect = {start: start, drag: drag, end: end};
}

/**********
    SETUP
**********/
options = {
  h: 250,
  w: 250,
  addTo: '.sample-div',
  addBorderRect: true,
}
var c = new SVGCanvas(options);
