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
}

/**********
    SETUP
**********/
options = {
  h: 250,
  w: 250,
  addTo: '.step-1',
  addBorderRect: true,
}
var c = new SVGCanvas(options);
