function drawInlineSVG(svgElement, ctx, callback){
  // https://stackoverflow.com/questions/27230293/how-to-convert-svg-to-png-using-html5-canvas-javascript-jquery-and-save-on-serve/33227005#33227005
  var svgURL = new XMLSerializer().serializeToString(svgElement);
  var img  = new Image();
  img.onload = function(){
    ctx.drawImage(this, 0,0);
    callback();
    }
  img.src = 'data:image/svg+xml; charset=utf8, '+encodeURIComponent(svgURL);
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
    .style('fill', 'white');

  for (var ii = 0; ii < 10; ii++) {
    var txt = svg.append('text')
      .text(ii)
      .attr('x', 10 + 13*ii)
      .attr('y', 25 + 13*ii)
      .style('font-size', 12 + 1.2 * ii)
      .style('color', 'black')
      .style('padding', 0);
    
    if ( ii % 2 == 0 ) {
      txt.style('font-family', 'cursive');
    } else {
      txt.style('font-family', '"Goudy Bookletter 1911", sans-serif');
    }

    var txtBB = txt.node().getBBox();
    console.log(ii, txtBB);
    svg.append('rect')
      .attr('x', txtBB.x)
      .attr('y', txtBB.y)
      .attr('height', txtBB.height)
      .attr('width', txtBB.width)
      .style('fill', 'red')
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


window.onload = function () {
  demoSvgToCanvas();
}

