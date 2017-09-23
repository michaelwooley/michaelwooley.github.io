window.onload = function () {

  var fonts = ["Roboto", "Permanent Marker", "Condiment", "Reenie Beanie", "Monoton"];
  var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ',', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  WebFontConfig = {
    google: {
      families: fonts,
    },
    active: function () {
      start();
    },
  };

  (function (d) {
    var wf = d.createElement('script'),
      s = d.scripts[0];
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
    wf.async = false;
    s.parentNode.insertBefore(wf, s);
  })(document);

  function start() {
    //demoSvgToCanvas();
    var h = 100,
      w = 125,
      c = 4;

    //drawChar('g', fonts[2], 'div.tight-bb', h, w, true);
    // Make a table
    var tab = d3.select('div.tight-bb')
      .append('table')
      .attr('class', 'table table-hover');
    var header = tab.append('tr');
    for (var ii in fonts) {
      header.append('th')
          .text(fonts[ii])
          .style('font-family', fonts[ii]);
    }
    var body = tab.append('tbody');
    // Cycle through each
    var font, char, row;
    for (var jj in chars) {
      char = chars[jj];
      row = body.append('tr');
      for (var ii in fonts) {
        font = fonts[ii];
        id = 'char-' + jj + '-font-' + ii;
        row.append('td')
          .attr('id', id);
        drawChar(char, font, 'td#'+id, h, w, true);
      }
    }
  }
}
