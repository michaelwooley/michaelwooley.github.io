var arrayIndex1d3d = function (ii, w, h, c) {
  // Given ImageData.data index, get tuple location of pixel
  var out = [-99, -99, -99];

  // What column?
  out[1] = Math.floor(ii / (c * w));
  // What row?
  out[0] = Math.floor((ii - (out[1] * c * w)) / c);
  // What Channel?
  out[2] = ii % c;

  return out;
}

var tightBBox = function (data) {
  // Get a tight bounding box for the image data.

  var xyz;
  var xmin = data.width + 1,
    xmax = -1,
    ymin = data.height + 1,
    ymax = -1;

  for (var ii = 3; ii < data.data.length; ii += 4) {

    if (data.data[ii] > 0) {
      // Get coordinate in terms of (x, y, z)
      xyz = arrayIndex1d3d(ii, data.width, data.height, 4);
      // Update bounds
      if (xyz[0] < xmin) {
        xmin = xyz[0];
      }
      if (xyz[0] > xmax) {
        xmax = xyz[0];
      }
      if (xyz[1] < ymin) {
        ymin = xyz[1];
      }
      if (xyz[1] > ymax) {
        ymax = xyz[1];
      }
    }
  }

  return {
    x: xmin,
    y: ymin,
    width: xmax - xmin,
    height: ymax - ymin,
  };

}

d3.selection.prototype.getTightBBox = function () {

  var self = this;

  // Check to ensure that it is a text element
  if (self.node().tagName.toLowerCase() != 'text') {
    console.error('d3.selection.getTightBBox can only accommodate SVG <text> elements.');
    return;
  }

  // Scaling factor
  var k = 10, c = 4;
  // Get parent SVG (how to throw good error?)
  var svgText = self._groups[0][0].ownerSVGElement;
  // Check in on fonts to ensure all is okay.
  // Do this before setting the loose bounding box because may change
  // the font.
  var targetFont = k * parseFloat(self.style('font-size')) + 'px ' + self.style('font-family');
  if (!document.fonts.check(targetFont)) {
    targetFont = k * parseFloat(self.style('font-size')) + 'px sans';
    self.style('font-family', 'sans');
    console.warn('d3.selection.getTightBBox: Font family ' + targetFont + ' not found. Setting to "sans" font and proceeding.');
  }
  // Loose Bounding Box
  lBB = self.node().getBBox();
  // Make a canvas to search for element
  var canvas = d3.select('body')
    .append('canvas')
    .attr('height', k * svgText.clientHeight)
    .attr('width', k * svgText.clientWidth)
    .style('display', 'none')
    .node();
  // Get and set the context based on others
  var ctx = canvas.getContext('2d');
  ctx.font = targetFont;
  ctx.fillText(self.text(), k * parseFloat(self.attr('x')), k * parseFloat(self.attr('y')));
  
  // Break the image into pixels
  var imgData = ctx.getImageData(k * lBB.x, k * lBB.y, k * lBB.width, k * lBB.height);
  // Use the image data to get a tight bounding box
  var bb = tightBBox(imgData);
  // Undo scaling to get back to svg
  bb.x = (bb.x / k) + lBB.x;
  bb.y = (bb.y / k) + lBB.y;
  bb.width = bb.width / k;
  bb.height = bb.height / k;

  self.node().tBB = bb;
  canvas.remove();

};
