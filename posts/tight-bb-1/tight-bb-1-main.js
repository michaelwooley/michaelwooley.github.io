function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawChar(char, font, fontSize, ctx, w, h) {
  // Demonstrate how an SVG element can be converted to a canvas.

  var txt = ctx
    .append('text')
    .text(char)
    .attr('x', 0)
    .attr('y', 0)
    .style('font-size', fontSize)
    .style('color', 'black')
    .style('padding', 0)
    .style('font-family', font)
    .style('opacity', 0.5);

  // Make sure fully on canvas
  lBB = txt.node().getBBox();
  txt.attr('x', getRndInteger(0, w - lBB.width))
    .attr('y', getRndInteger(lBB.height, h - lBB.height));

  // Get Tight Bounding Box
  txt.getTightBBox();

  // Tight BBox
  tBB = txt.node().tBB;
  ctx.append('rect')
    .attr('x', tBB.x)
    .attr('y', tBB.y)
    .attr('height', tBB.height)
    .attr('width', tBB.width)
    .style('fill', '#4285F4')
    .style('opacity', 1)
    .lower();

  // Outer Bounding Box
  lBB = txt.node().getBBox();
  ctx.append('rect')
    .attr('x', lBB.x)
    .attr('y', lBB.y)
    .attr('width', lBB.width)
    .attr('height', lBB.height)
    .style('fill', '#aa66cc')
    .style('opacity', 1)
    .lower();
}


window.onload = function () {

  var fonts = ["Roboto", "Permanent Marker", "Condiment", "Reenie Beanie", "Monoton"];

  WebFontConfig = {
    google: {
      families: fonts,
    },
    active: start,
  };

  (function (d) {
    var wf = d.createElement('script'),
      s = d.scripts[0];
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
    wf.async = true;
    s.parentNode.insertBefore(wf, s);
  })(document);

  var h = 225,
    w = 250,
    c = 4;
  var addTo = 'div.sample-div';

  // Add a container svg.
  var svg = d3.select(addTo)
    .append('svg')
    .attr('width', w)
    .attr('height', h);
  svg.append('rect')
    .attr('width', w)
    .attr('height', h)
    .style('fill', '#2BBBAD');
  var g = svg.append('g')

  // Add controls
  var ctrl = d3.select('div.sample-div').append('div').style('margin', '0');
  //// Input
  var inp = ctrl.append('input')
    .attr('class', 'form-control')
    .attr('value', 'Sample Text')
    .style('width', '8em')
    .attr('placeholder', 'Sample Text')
    .style('font-family', fonts[0])
    .style('font-size', '1em');
  //// Font Size
  var fs = ctrl.append('input')
    .attr('class', 'form-control')
    .attr('placeholder', '45')
    .style('width', '4em')
    .style('font', 'caption');
  //// Fonts
  var fc = ctrl.append('select')
    .attr('class', 'custom-select')
    .style('font-family', fonts[0])
    .style('font-size', 8)
    .on('click', function () {
      d3.select(this).style('font-family', this.value);
      inp.style('font-family', this.value);
    });
  for (var ii in fonts) {
    fc.append('option')
      .attr('value', fonts[ii])
      .text(fonts[ii])
      .style('font-family', fonts[ii])
      .style('font-size', 12);
  }
  fs.node().value = 45;
  //// Submit Button
  var submit = ctrl
    .append('button')
    .attr('type', 'button')
    .attr('class', 'btn')
    .attr('disabled', true)
    .style('font', 'caption')
    .text('Make Example')
    .on('click', function () {
      g.selectAll('rect').remove();
      g.selectAll('text').remove();
      drawChar(inp.node().value, fc.node().value, fs.node().value, g, h, w);
    });

  function start() {
    drawChar('1', fc.node().value, fs.node().value, g, h, w);
    submit
      .attr('disabled', null);

  }
}
