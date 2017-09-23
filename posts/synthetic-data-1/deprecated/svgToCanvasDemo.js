function drawInlineSVG(svgElement, callback) {
  // https://stackoverflow.com/questions/27230293/how-to-convert-svg-to-png-using-html5-canvas-javascript-jquery-and-save-on-serve/33227005#33227005
  var svgURL = new XMLSerializer().serializeToString(svgElement);
  var img = new Image();
  img.onload = function () {
    console.log('here');
    callback(this);
  }
  img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);

}

function demoSvgToCanvas() {
  // Demonstrate how an SVG element can be converted to a canvas.
  w = 150, h = 150;
  addTo = 'div.svg-to-canvas';

  var svg = d3.select(addTo)
    .append('div')
    .style('float', 'left')
    .text('SVG')
    .append('p')
    .append('svg')
    .attr('height', h)
    .attr('width', w)
    .attr('id', 'svg-canvas');

  var border = svg.append('rect')
    .attr('height', h)
    .attr('width', w)
    .style('fill', 'black')
    .style('opacity', 0.1);

  for (var ii = 0; ii < 10; ii++) {
    var txt = svg.append('text')
      .text(ii)
      .attr('x', 10 + 13 * ii)
      .attr('y', 25 + 13 * ii)
      .style('font-size', 12 + 1.2 * ii)
      .style('color', 'black')
      .style('padding', 0);

    if (ii % 2 == 0) {
      txt.style('font-family', 'cursive');
    } else {
      txt.style('font-family', '"Goudy Bookletter 1911", sans-serif');
    }

    var txtBB = txt.node().getBBox();
    //txt.attr('y', txtBB.y + txtBB.height);

    console.log(ii, txtBB);
    svg.append('rect')
      .attr('x', txtBB.x)
      .attr('y', txtBB.y)
      .attr('height', txtBB.height)
      .attr('width', txtBB.width)
      .style('fill', 'red')
      .style('stroke', 'red')
      .style('opacity', 0.5);
  }

  d3.select(addTo)
    .append('div')
    .style('float', 'right')
    .text('<canvas> Copy')
    .append('p')
    .append('canvas')
    .attr('width', w)
    .attr('height', h)
    .attr('id', 'canvas');

  var svgText = document.getElementById("svg-canvas");
  var myCanvas = document.getElementById("canvas");
  var ctx = myCanvas.getContext("2d");

  // usage:
  var out = drawInlineSVG(svgText, ctx,
    function () {
      console.log(myCanvas.toDataURL()); // -> PNG
    });
}



function demoGetTightBBox(char, w, h, k) {
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

  d3.select(addTo)
    .append('div')
    .style('float', 'right')
    .text('<canvas> Copy')
    .append('p')
    .style('padding', '10px')
    .append('canvas')
    .attr('width', k*w)
    .attr('height', k*h)
    .attr('id', 'canvas');

}


var arrayIndex1d3d = function (ii, h, w, c) {
  // Given ImageData.data index, get tuple location of pixel
  var out = [-99, -99, -99];

  // What column?
  out[1] = Math.floor(ii / (c * h));
  // What row?
  out[0] = Math.floor((ii - (out[1] * c * h)) / c);
  // What Channel?
  out[2] = ii % c;

  return out;
}

var tightBBox = function (data, h, w, c) {
  // Get a tight bounding box for the image data.

  var xyz;
  var xmin = w + 1,
    xmax = -1,
    ymin = h + 1,
    ymax = -1;

  for (var ii = 3; ii < data.length; ii += c) {
    
    if (data[ii] > 0) {
      // Get coordinate in terms of (x, y, z)
      xyz = arrayIndex1d3d(ii, h, w, c);
      
      // Update bounds
      if (xyz[0] < xmin) {
        xmin = xyz[0];
      }
      if (xyz[0] > xmax) {
        xmax = xyz[0]
      }
      if (xyz[1] < ymin) {
        ymin = xyz[1];
      }
      if (xyz[1] > ymax) {
        ymax = xyz[1]
      }
    }
  }

  return {
    x: xmin,
    y: ymin,
    width: xmax - xmin,
    height: ymax - ymin
  };

}

var svgToPngCallback = function (ctx, svg, h, w, c, k) {

  return function (arg) {
    ctx.drawImage(arg, 0, 0, w, h, 0, 0, w * k, h * k);
    //ctx.imageSmoothingEnabled = true;
    //ctx.webkitImageSmoothingEnabled = true;
    
    var imgData = ctx.getImageData(0, 0, k*h, k*w);
    var bb = tightBBox(imgData.data, k*h, k*w, c);

    console.log(bb);
    console.log(bb.x/k, bb.y/k, bb.height/k, bb.width/k);
    
    // Draw canvas BB
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "red";
    ctx.rect(bb.x, bb.y, bb.width, bb.height);
    ctx.stroke();
    
    // Draw on SVG
    svg.append('rect')
      .attr('x', bb.x/k)
      .attr('y', bb.y/k)
      .attr('width', bb.width/k)
      .attr('height', bb.height/k)
      .style('opacity', 0.5)
      .style('fill', 'red')
      .lower();
  }
}

var test = function (w, h, c, k) {
  
  var svg = d3.select('svg');
  
  var svgText = document.getElementById("svg-canvas");
  var myCanvas = document.getElementById("canvas");
  var ctx = myCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.webkitImageSmoothingEnabled = true;

  //
  var callback = svgToPngCallback(ctx, svg, h, w, c, k);

  // usage:
  drawInlineSVG(svgText, callback);
}





window.onload = function () {
  //demoSvgToCanvas();
  var h = 128, w = 128, c = 4, k = 10;
  demoGetTightBBox('a', h, w, k);
  test(h, w, c, k);

}
