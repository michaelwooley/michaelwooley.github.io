function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function drawInlineSVG(svgElement, ctx, callback) {
  // https://stackoverflow.com/questions/27230293/how-to-convert-svg-to-png-using-html5-canvas-javascript-jquery-and-save-on-serve/33227005#33227005
  var svgURL = new XMLSerializer().serializeToString(svgElement);
  var img = new Image();
  img.onload = function () {
    ctx.drawImage(this, 0, 0);
    callback();
  }
  img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
}

function SyntheticData(options) {
  // An object for creating synthetic data
  //var self = this;
  // Set options
  this.options = {} || options;
  this.options.type = options.type || 'digit';
  this.options.h = options.h || 250;
  this.options.w = options.w || 250;
  this.options.samples = options.samples || 3;
  this.options.exPerSample = options.exPerSample || 2;
  this.options.jiggleX = options.jiggleX || [0.85, 1.1];
  this.options.jiggleY = options.jiggleY || [0.8, 1.1];
  this.options.addTo = options.addTo || 'body';
  this.options.debug = options.debug || false;
  this.options.verbose = options.verbose || true;
  this.options.fontFamilies = ['Droid Sans', 'Droid Serif', 'Love Ya Like A Sister'];

  // Load fonts
  WebFont.load({
    google: {
      families: this.options.fontFamilies
    }
  });

  this.constructSamples();
}

SyntheticData.prototype.constructSamples = function () {
  // Make the samples
  var self = this;

  if (self.options.type == 'digit') {
    for (var ii = 0; ii < self.options.samples; ii++) {
      self.makeRandomDigitSvgSample(ii);
    }

  }

}

SyntheticData.prototype.drawSvgCharacter = function (svg, opt, kk) {
  // Draw a character on an SVG
  var self = this;

  // Add the element to the 
  var txt = svg.append('text')
    .text(opt.txt)
    .attr('x', opt.x)
    .attr('y', opt.y)
    .attr('id', 'char-' + kk)
    .style('font-family', opt.fontFamily)
    .style('font-size', opt.fontSize)
    .style('fill', opt.color)
    //.style('padding', 0)
    .style('baseline-shift', 'super');

  // Get bounding box and jiggle
  var bb = txt.node().getBBox();
  
  //txt.attr('y', bb.y + bb.height);
  
  return bb;
}

SyntheticData.prototype.makeRandomDigitSvgSample = function (ii) {
  // Generate an svg with random digits
  var self = this;

  // TODO: Ensure non-overlapping

  var setOpts = function () {
    // Set options on add digits
    var opt = {};
    opt.txt = getRandomIntInclusive(0, 9);
    opt.fontSize = getRandomIntInclusive(9, 40);
    opt.x = getRandomIntInclusive(0, self.options.w);
    opt.y = getRandomIntInclusive(0, self.options.h);
    opt.color = 'purple';
    opt.fontFamily = self.options.fontFamilies[getRandomIntInclusive(0, self.options.fontFamilies.length)];

    return opt;
  }

  // Create the svg
  var svg = d3.select(self.options.addTo)
    .append('div')
    .attr('class', 'synthetic-data digit')
    .attr('id', 'synth-div-' + ii)
    //.style('display', 'a') /// <= Control the visibility
    .append('svg')
    .attr('height', self.options.h)
    .attr('width', self.options.w)
    .attr('id', 'svg-' + ii);

  for (var kk = 0; kk < self.options.exPerSample; kk++) {
    opt = setOpts();
    bb = self.drawSvgCharacter(svg, opt, kk);
    ctx= 'svg#svg-' + ii + ' text#char-' + kk;
    console.log(ctx);
    bb = self.checkInBounds(ctx, bb);

    // Debug testing
    if (self.options.debug) {
      svg.append('rect')
        .attr('x', bb.x)
        .attr('y', bb.y)
        .attr('height', bb.height)
        .attr('width', bb.width)
        .style('fill', 'none')
        .style('stroke', 'green')
        .style('opacity', 0.5);
    }
  }

  // Debug testing
  if (self.options.debug) {
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', self.options.h)
      .attr('width', self.options.w)
      .style('fill', 'none')
      .style('stroke', 'black')
      .style('opacity', 0.5);
  }
}

SyntheticData.prototype.checkInBounds = function (ctx, bb) {
  // Check to ensure that annotation is within the SVG
  var self = this;
  var fix = false;

  // 1. Check for "true" bounding box
  if ((bb.x + bb.width) > self.options.w) {
    bb.x = getRandomIntInclusive(0, self.options.w - bb.width);
    fix = true;
  }
  if ((bb.y + bb.height) > self.options.h) {
    bb.y = getRandomIntInclusive(bb.height, self.options.h - bb.height);
    fix = true;
  }
  if (bb.y < 0) {
    bb.y = getRandomIntInclusive(bb.height, self.options.h - bb.height);
    fix = true;
  }

  // 3. Change coordinates if necessary
  if (fix) {
    d3.select(ctx)
      .attr('x', bb.x)
      .attr('y', bb.y);
  }

  return bb;
}


SyntheticData.prototype.svgToPixels = function (svg) {
  // Convert SVG to pixels

}

window.onload = function () {
  //demoSvgToCanvas();
  options = {
    debug: true,
    exPerSample: 3,
  };

  var sd = new SyntheticData(options);
}


//    // Add a tooltip with coordinates
//    var g = d3.select(svgText).append('g')
//      .attr('class', 'verbose-tooltip')
//      .attr('transform', 'translate(25, 25)')
//      .style('opacity', '0');
//    
//    g.append('text')
//      .style('font-size', '0.5rem')
//      .text('Bounding Box');
//    g.append('text')
//      .attr('y', '0.5rem')
//      .style('font-size', '0.5rem')
//      .text('x: ' + tBB.x.toFixed(2));
//    g.append('text')
//      .attr('y', '1rem')
//      .style('font-size', '0.5rem')
//      .text('y: ' + tBB.y.toFixed(2));
//    g.append('text')
//      .attr('y', '1.5rem')
//      .style('font-size', '0.5rem')
//      .text('Width: ' + tBB.width.toFixed(2));
//    
//    self.on('mouseenter', function () {
//        g.style('opacity', '0.7')
//          .attr('transform', 'translate(' + d3.mouse(svgText)[0] + ',' + d3.mouse(svgText)[1] + ')');
//      })
//      .on('mouseleave', function () { g.style('opacity', '0'); });

// TODO: Add rotation, etc.
