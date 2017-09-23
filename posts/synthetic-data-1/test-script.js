function drawChar(char, w, h, k) {
  // Demonstrate how an SVG element can be converted to a canvas.
  addTo = 'div.tight-bb';

  var svg = d3.select(addTo)
    .append('div')
    .style('float', 'left')
    .text('SVG')
    .append('p')
    .append('svg')
    .attr('height', h)
    .attr('width', w)
    .attr('id', 'svg-canvas');

  var txt = svg
    .append('text')
    .text(char)
    .attr('x', 0)
    .attr('y', 0.9 * h)
    .style('font-size', 0.9 * h)
    .style('color', 'black')
    .style('padding', 0)
    .style('font-family', '"Goudy Bookletter 1911", sans-serif');
}

window.onload = function () {
  //demoSvgToCanvas();
  var h = 128, w = 128, c = 4, k = 10;
  drawChar('1', h, w, k);
  
  out = {};

  var txt = d3.select('text').getTightBBox(function(self){out['sample'] = self.node().tBB;}, verbose=true);  
  
  console.log(out);
}