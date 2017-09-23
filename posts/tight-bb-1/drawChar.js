function drawChar(char, font, addTo, w, h, showLooseBB = false) {
  // Demonstrate how an SVG element can be converted to a canvas.

  var svg = d3.select(addTo)
    .append('svg')
    .attr('height', h)
    .attr('width', w)
    .attr('id', 'svg-canvas');

  var txt = svg
    .append('text')
    .text(char)
    .attr('x', 25)
    .attr('y', 78)
    .style('font-size', '50')
    .style('color', 'black')
    .style('padding', 0)
    .style('font-family', font);

  if (showLooseBB) {
    var callback = function (self) {
      lBB = self.node().getBBox();

      d3.select(self._groups[0][0].ownerSVGElement).append('rect')
        .attr('x', lBB.x)
        .attr('y', lBB.y)
        .attr('width', lBB.width)
        .attr('height', lBB.height)
        .style('fill', 'red')
        .style('opacity', 0.2)
        .lower();
    }
  } else {
    var callback = function () {
      null;
    }
  }

  txt.getTightBBox();

  // Display Tight BBox
  tBB = txt.node().tBB;
  d3.select(txt._groups[0][0].ownerSVGElement).append('rect')
    .attr('x', tBB.x)
    .attr('y', tBB.y)
    .attr('height', tBB.height)
    .attr('width', tBB.width)
    .style('fill', 'green')
    .style('opacity', 0.6)
    .lower();

  // Display Loos Bounding Box
  lBB = txt.node().getBBox();
  d3.select(txt._groups[0][0].ownerSVGElement).append('rect')
    .attr('x', lBB.x)
    .attr('y', lBB.y)
    .attr('width', lBB.width)
    .attr('height', lBB.height)
    .style('fill', 'red')
    .style('opacity', 0.2)
    .lower();
}