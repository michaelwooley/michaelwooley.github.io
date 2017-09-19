function BrowserDetection() {
  //https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
  if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
    return 'Opera 8.0+';
  } else if (typeof InstallTrigger !== 'undefined') {
    return 'Firefox 1.0+';
  } else if (/constructor/i.test(window.HTMLElement) || (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification))) {
    return 'Safari 3.0+';
  } else if ( /*@cc_on!@*/ false || !!document.documentMode) {
    return 'Internet Explorer 6-11';
  } else if (!!window.StyleMedia) {
    return 'Edge 20+';
  } else if (!!window.chrome && !!window.chrome.webstore) {
    return 'Chrome 1+';
  } else if (!!window.CSS) {
    return 'Blink engine detection';
  } else {
    return 'Unknown Browser';
  }
}

function getRandInt(magnitude = 6) {
  //  Get a random integer of specified `magnitude`.
  //  
  //  Input:
  //    - magnitude: Magnitude of random int.
  //    
  //  Returns: 
  //    - A random integer of specified magnitude.

  return Math.floor(Math.random() * (10 ** magnitude));
}

function SVGCanvas(options) {
  /*
   *  An SVG-based drawing app.
   *  Input:
   *   - options: An object consisting of:
   *    - h: The height of the canvas (default: 250px).
   *    - w: The width of the canvas (default: 250px).
   *    - addTo: CSS Selector for element on which to add canvas (default: 'body').
   *    - addBorderRect: (bool) Add a border around the canvas (default: true).
   *    - dbWidth: Width of selection borders (default=0.75).
   *    - debug: (bool) run in debug mode (default=false).
   *  Returns: An SVG object contained in the `addTo` DOM element.
   */
  var self = this;
  // Set the global SVG options
  this.options = options || {};
  this.options.h = options.h || 250;
  this.options.w = options.w || 250;
  this.options.addTo = options.addTo || 'body';
  this.options.addBorderRect = options.addBorderRect || true;
  this.options.dbWidth = 0.75;
  this.options.debug = options.debug || false;
  this.canvasID = 'canvas-' + getRandInt();

  // Make A Distinct Container

  // Set the state (elaborate on more later)
  //// All Possible States
  this.stateData = options.stateData || this.loadStateData();
  // Present State
  this.state = this.stateData[0];

  // Add the container
  this.addContainer();
  // Add the menu
  this.addMenu();
  // Add the Canvas
  this.addCanvas();

  // Rectangles
  //// Current Selection
  this.Rect = {
    'r': null,
    'g': null,
  };
  //// Collection
  this.Shapes = {}; // Collection

  // Transformation state
  this.transform = d3.zoomTransform(this.zoomG.node());

  // Load methods for behaviors
  this.makeAddRect(); // Add Rectangle Methods
  this.makeZoomPan(); // SVG Zooming and Panning Methods
  this.makeDragBehavior();

  // Dragging Behavior - account for both addRect and pan.
  this.svg.call(
    d3.drag()
    .on('start', self.dragBehavior.start)
    .on('drag', self.dragBehavior.drag)
    .on('end', self.dragBehavior.end)
  );

  // Zooming behavior
  this.svg.call(
      d3.zoom()
      .scaleExtent([1, 10])
      .on('zoom', this.zoomPan.zoom)
    )
    .on('mousedown.zoom', null)
    .on('mousemove.zoom', null)
    .on('mouseup.zoom', null)
    .on('touchstart.zoom', null)
    .on('touchmove.zoom', null)
    .on('touchend.zoom', null);

  // Keydown events
  d3.select('body').on('keydown', this.keydownEventHandlers);
}


SVGCanvas.prototype.makeZoomPan = function () {
  // Defines zooming and panning behavior from zoom listener

  var self = this;

  checkBounds = function () {
    // Check whether zooming/panning out of bounds and correct transform if needed.
    var svgBB = self.svg.node().getBBox();

    // Bottom border
    if (((-self.transform.y + svgBB.height) / self.transform.k) > svgBB.height) {
      self.transform.y = -(svgBB.height * self.transform.k) + svgBB.height;
    }

    // Top border
    if (((self.transform.y + 0) / self.transform.k) > 0) {
      self.transform.y = 0;
    }

    // Left border
    if (((-self.transform.x + svgBB.width) / self.transform.k) > svgBB.width) {
      self.transform.x = -(svgBB.width * self.transform.k) + svgBB.width;
    }

    // Right border
    if (((self.transform.x + 0) / self.transform.k) > 0) {
      self.transform.x = 0;
    }

  }

  zoom = function () {
    self.transform = d3.event.transform;
    checkBounds();
    self.zoomG.attr('transform', self.transform);

  }

  var pan = function () {
    self.transform.x += d3.event.dx;
    self.transform.y += d3.event.dy;

    checkBounds();

    // Update Attribute
    d3.select('g.zoom-group').attr('transform', self.transform);
  }

  self.zoomPan = {
    zoom: zoom,
    pan: pan
  };

}

SVGCanvas.prototype.mouseOffset = function () {
  // Utility function for getting mouse offset
  return d3.mouse(this.zoomG.node());
}

SVGCanvas.prototype.makeAddRect = function () {
  // Methods for adding rectangles to the svg.
  var self = this;
  var r, g, x0, y0;

  start = function () {
    //Add a rectangle
    // 1. Get mouse location in SVG
    var m = self.mouseOffset();
    x0 = m[0];
    y0 = m[1];
    // 2. Add a new group
    g = self.zoomG
      .append('g')
      .attr('class', 'g-rect ' + self.state.id);
    // 3. Make a rectangle
    r = g
      .append('rect') // An SVG `rect` element
      .attr('x', x0) // Position at mouse location
      .attr('y', y0)
      .attr('width', 1) // Make it tiny
      .attr('height', 1)
      .attr('class', 'rect-main ' + self.state.class + ' ' + self.state.id)
      .style('stroke', self.state.color)
      .style('fill', 'none');
    // 4. Make it active.
    self.setActive(self.state.id);
  }
  drag = function () {
    // What to do when mouse is dragged
    // 1. Get the new mouse position
    var m = self.mouseOffset();
    // 2. Update the attributes of the rectangle
    r.attr('x', Math.min(x0, m[0]))
      .attr('y', Math.min(y0, m[1]))
      .attr('width', Math.abs(x0 - m[0]))
      .attr('height', Math.abs(y0 - m[1]));
  }
  end = function () {
    // What to do on mouseup
    // Add Rectangle Transformation Methods
    self.transformRect(r, g);
    // Update count and id
    self.state.count += 1;
    self.state.id = self.state.name + '-' + self.state.count;
  }

  self.addRect = {
    start: start,
    drag: drag,
    end: end,
  };
}

SVGCanvas.prototype.makeDragBehavior = function () {
  var self = this;
  var set = false; // Disable retroactive re-fitting

  var start = function () {
    if (!d3.event.sourceEvent.shiftKey) {
      self.addRect.start();
      set = true;
    }
    if (d3.event.sourceEvent.shiftKey) {
      null;
    }
  }

  var drag = function () {
    if (set && !(d3.event.sourceEvent.shiftKey)) {
      self.addRect.drag();
    }
    if (d3.event.sourceEvent.shiftKey) {
      self.zoomPan.pan();
    }
  }

  var end = function () {
    if (set &
      !(d3.event.sourceEvent.shiftKey)) {
      self.addRect.end();
      set = false;
    }
    if (d3.event.sourceEvent.shiftKey) {
      null;
    }
  }

  self.dragBehavior = {
    start: start,
    drag: drag,
    end: end
  };
}

/**********************************
Dragging and resizing rectangles.
**********************************/
function contains(a, obj) {
  // See: https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-an-object-in-javascript
  for (var i = 0; i < a.length; i++) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
}

function clone(selector) {
  // Clone a d3 selection. 
  // Source: https://stackoverflow.com/questions/39477740/copy-and-insert-in-d3-selection
  var node = d3.select(selector).node();
  return d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling));
}


SVGCanvas.prototype.transformRect = function (r, g) {
  var self = this;
  var groupClass, debug, p, dbWidth;

  var main = function () {

    dbWidth = self.options.dbWidth;
    // Set common class
    groupClass = self.state.id;
    debug = self.options.debug ? (' debug') : ('');

    // Add data to the group element
    var rBB = r.node().getBBox();
    p = {
      x: rBB.x,
      y: rBB.y,
      w: rBB.width,
      h: rBB.height,
      id: groupClass,
      type: self.state.name,
    };
    g = g.data([p]);

    // Add the hidden bounding rectangles
    makeRectEdgeCorner();
  }

  main();

  function setCoordsData(d) {
    // Set the coordinates of a rectangle-group

    var children = d3.selectAll('g.active.' + d.id);

    // Main Rectangle
    children.select('rect.rect-main')
      .attr('x', d.x)
      .attr('y', d.y)
      .attr('width', d.w)
      .attr('height', d.h);

    // rectEdge.left
    children.select('rect.rectEdge.rectEdge-left')
      .attr('x', d.x - (dbWidth / 2))
      .attr('y', d.y + (dbWidth / 2))
      .attr('width', dbWidth)
      .attr('height', Math.abs(d.h - dbWidth));

    // rectEdge.right
    children.select('rect.rectEdge.rectEdge-right')
      .attr('x', d.x + d.w - (dbWidth / 2))
      .attr('y', d.y + (dbWidth / 2))
      .attr('width', dbWidth)
      .attr('height', Math.abs(d.h - dbWidth));

    // rectEdge.top
    children.select('rect.rectEdge.rectEdge-top')
      .attr('x', d.x + (dbWidth / 2))
      .attr('y', d.y - (dbWidth / 2))
      .attr('width', Math.abs(d.w - dbWidth))
      .attr('height', dbWidth);

    // rectEdge.bottom
    children.select('rect.rectEdge.rectEdge-bottom')
      .attr('x', d.x + (dbWidth / 2))
      .attr('y', d.y + d.h - (dbWidth / 2))
      .attr('width', Math.abs(d.w - dbWidth))
      .attr('height', dbWidth);

    // rectCorner.topleft
    children.select('rect.rectCorner.rectCorner-topleft')
      .attr('x', d.x - (dbWidth / 2))
      .attr('y', d.y - (dbWidth / 2));

    // rectCorner.topright
    children.select('rect.rectCorner.rectCorner-topright')
      .attr('x', d.x + d.w - (dbWidth / 2))
      .attr('y', d.y - (dbWidth / 2));

    // rectCorner.botleft
    children.select('rect.rectCorner.rectCorner-botleft')
      .attr('x', d.x - (dbWidth / 2))
      .attr('y', d.y + d.h - (dbWidth / 2));

    // rectCorner.botright
    children.select('rect.rectCorner.rectCorner-botright')
      .attr('x', d.x + d.w - (dbWidth / 2))
      .attr('y', d.y + d.h - (dbWidth / 2))

  }

  // Add move and resize methods
  function moveRect() {
    // Move the rectangle by dragging edges
    var activeG;

    function start() {
      self.setActive(groupClass);
      self.svg.style('cursor', 'move');
      activeG = d3.selectAll('g.active');
    }

    function drag() {
      var svgBB = self.svg.node().getBBox();

      activeG.each(
        function (d, i) {
          // Alter Parameters
          d.x = Math.max(0, Math.min(svgBB.width - d.w, d.x + d3.event.dx));
          d.y = Math.max(0, Math.min(svgBB.height - d.h, d.y + d3.event.dy));

          // Set Coordinates
          setCoordsData(d);
        }
      )
    }

    function end() {
      // Undo formatting
      self.svg.style('cursor', 'default');
    }

    // What to do on drag
    var dragcontainer = d3.drag()
      .on('start', start)
      .on('drag', drag)
      .on('end', end);

    return {
      drag: dragcontainer,
    }
  }

  function resizeRect() {
    // Resize the rectangle by dragging the corners

    function getDragCorners() {
      return {
        topleft: function (d, bb0, m) {
          var svgBB = self.svg.node().getBBox();

          d.x = Math.max(0, Math.min(bb0.x + bb0.width, m[0]));
          d.y = Math.max(0, Math.min(bb0.y + bb0.height, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(svgBB.width - d.x), Math.abs(bb0.x + bb0.width - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(svgBB.height - d.y), Math.abs(bb0.y + bb0.height - m[1])) : d.h;
        },

        topright: function (d, bb0, m) {
          var svgBB = self.svg.node().getBBox();

          d.x = Math.max(0, Math.min(bb0.x, m[0]));
          d.y = Math.max(0, Math.min(bb0.y + bb0.height, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(svgBB.width - d.x), Math.abs(bb0.x - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(svgBB.height - d.y), Math.abs(bb0.y + bb0.height - m[1])) : d.h;
        },

        botleft: function (d, bb0, m) {
          var svgBB = self.svg.node().getBBox();

          d.x = Math.max(0, Math.min(bb0.x + bb0.width, m[0]));
          d.y = Math.max(0, Math.min(bb0.y, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(svgBB.width - d.x), Math.abs(bb0.x + bb0.width - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(svgBB.height - d.y), Math.abs(bb0.y - m[1])) : d.h;
        },

        botright: function (d, bb0, m) {
          var svgBB = self.svg.node().getBBox();

          d.x = Math.max(0, Math.min(bb0.x, m[0]));
          d.y = Math.max(0, Math.min(bb0.y, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(svgBB.width - d.x), Math.abs(bb0.x - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(svgBB.height - d.y), Math.abs(bb0.y - m[1])) : d.h;
        }
      };
    }

    var makeContainer = function (id) {
      // Make a container, which depends on the corner (specified by `id`)
      var dragCorners, cursor, bb0;

      // Get the correct transformation function
      dragCorners = getDragCorners()[id];
      // Get the correct cursor
      if (contains(['topleft', 'botright'], id)) {
        cursor = 'nwse-resize';
      } else {
        cursor = 'nesw-resize';
      }

      var start = function () {
        // Set the present group to be active
        self.setActive(groupClass, false);
        // Get the active groups
        activeG = d3.selectAll('g.active');
        // Get the initial Bounding Box
        bb0 = r.node().getBBox();
        // Display correct cursor tip
        self.svg.style('cursor', cursor);
      }

      var drag = function () {
        // Mouse position
        m = self.mouseOffset();
        // Update parameters depending on
        dragCorners(g.datum(), bb0, m);
        // Set the coordinates
        setCoordsData(g.datum());
      }

      var end = function () {
        // Undo formatting
        self.svg.style('cursor', 'default');
      }

      // return the drag container
      return d3.drag()
        .on('start', start)
        .on('drag', drag)
        .on('end', end);

    }

    // Make drag containers for each 
    return {
      makeContainer: makeContainer,
    }
  }

  // Append helper rectEdges and rectCorners to g
  function makeRectEdgeCorner() {
    // Adds edges and corners to rectangle for drag move and resize.

    // "Prototype" elements
    var proto = [
    // Rectangular edges
    g.append('rect')
      .attr('class', 'rectEdge cornerEdge ' + groupClass + debug)
      ,

    // Circular corners - NWSE cursor
    g.append('rect')
        .attr('height', dbWidth)
        .attr('width', dbWidth)
        .attr('id', 'topright')
        .attr('class', 'rectCorner cornerEdge nwse ' + groupClass + debug)
        ,

    // Circular corners - NESW cursor
    g.append('rect')
        .attr('height', dbWidth)
        .attr('width', dbWidth)
        .attr('id', 'topright')
        .attr('class', 'rectCorner cornerEdge nesw ' + groupClass + debug)
        ,
    ];

    // Behaviors to attach to corners and edges
    var move = moveRect();
    var resize = resizeRect();

    // Create Edges
    clone('.rectEdge.' + groupClass)
      .classed('rectEdge-left', true)
      .call(move.drag);
    clone('.rectEdge.' + groupClass)
      .classed('rectEdge-right', true)
      .call(move.drag);
    clone('.rectEdge.' + groupClass)
      .classed('rectEdge-top', true)
      .call(move.drag);
    clone('.rectEdge.' + groupClass)
      .classed('rectEdge-bottom', true)
      .call(move.drag);

    // Create Corners
    clone('.nwse.' + groupClass)
      .classed('rectCorner-topleft', true)
      .call(resize.makeContainer('topleft'));
    clone('.nesw.' + groupClass)
      .classed('rectCorner-topright', true)
      .call(resize.makeContainer('topright'));
    clone('.nesw.' + groupClass)
      .classed('rectCorner-botleft', true)
      .call(resize.makeContainer('botleft'));
    clone('.nwse.' + groupClass)
      .classed('rectCorner-botright', true)
      .call(resize.makeContainer('botright'));

    // Remove prototype elements from DOM
    proto.forEach(function (d, i) {
      d.remove();
    });

    // Format size and shape of added objects.
    setCoordsData(g.datum());
  }
}

SVGCanvas.prototype.setActive = function (id, force_clear = false) {
  // Sets class to active for selected groups.
  var deactivate = false;

  // When should all other groups be deactivated?
  //  1.A If the ctrl key is not pressed
  //  1.B If the present element isn't already active
  //  (Use De Morgan's Rules for this one.)
  deactivate = deactivate || !(d3.event.sourceEvent.ctrlKey || d3.selectAll('g.' + id).classed('active'));
  //  2. If we didn't force it to be.
  deactivate = deactivate || force_clear;
  // If any of these conditions met, clear the active elements.
  if (deactivate) {
    this.svg.selectAll('g.active').classed('active', false);
  }

  // Add 'active' class to any 'g' element with id = id passed.
  d3.selectAll('g.' + id).classed('active', true);
}


SVGCanvas.prototype.keydownEventHandlers = function () {
  // Event handler for keydown events

  // Press 'Delete' to remove all active groups.
  if (d3.event.key === 'Delete') {
    d3.selectAll('g.active').remove();
  }
}

/*******************
  Overall Container
*******************/
SVGCanvas.prototype.addContainer = function () {
  var container = d3.select(self.options.addTo)
    .append('div')
    .attr('id', this.canvasID);
  //// Format the bounding containers
  ////// Containing Row
  var row1 = container
    .append('div')
    .attr('class', 'row')
    .style('padding', '0');
  ////// Column for the menu
  row1.append('div')
    .attr('class', 'col-10 SVGCanvas-menu')
    .style('position', 'static')
    .style('text-align', 'center')
    .style('min-width', '77px')
    .style('padding', 0)
    .style('border', function () {
      if (self.options.debug) {
        return '2px solid grey';
      } else {
        return '0px none white';
      }
    });
  ////// Column for the canvas
  var row2 = container
    .append('div')
    .attr('class', 'row')
    .style('padding', '0');
  row2.append('div')
    .attr('class', 'col-auto SVGCanvas-canvas')
    .style('position', 'static').style('border', function () {
      if (self.options.debug) {
        return '2px solid grey';
      } else {
        return '0px none white';
      }
    })
    .style('padding', 0);
}

/***************
  Menu Elements
***************/
SVGCanvas.prototype.addMenu = function () {
  // Adding menu elements
  var self = this;

  // Add as a table
  //// The table
  var tab = d3.select(self.options.addTo + ' div.SVGCanvas-menu')
    .append('ul')
    .attr('class', 'nav nav-pills');
  //// Button elements
  ////// The State Togglers
  tab.append('li')
    .attr('class', 'nav-item')
    .attr('id', 'buttonToggle')
    .style('margin', '0.15em');
  addStateTogglers(self.options.addTo + ' div.SVGCanvas-menu li#buttonToggle');
  ////// The Data Submit Button
  tab.append('li')
    .attr('class', 'nav-item')
    .attr('id', 'submitButton')
    .style('margin', '0.15em');
  addDataSubmitButton(self.options.addTo + ' div.SVGCanvas-menu li#submitButton');

  function addStateTogglers(addTo) {
    // Add the state toggler controls

    // Create the callback function to be called after each click.
    function callbackStateToggle(arg) {
      // What to do when the state toggle buttons are pushed

      // Update the old element
      //// Get the index of old element
      var idx = self.stateData.findIndex(function (element) {
        return element.name == self.state.name;
      });
      //// Update stateData
      self.stateData[idx] = self.state;

      // Break off the new state
      self.state = self.stateData.find(function (element) {
        return element.name == arg;
      });
    }
    //// Set the Options
    var stateToggleOpt = {
      type: 'dropdown',
      addTo: addTo,
      clickCall: callbackStateToggle,
    };
    //// Create the new object
    self.stateTogglers = new ButtonToggle(self.stateData, stateToggleOpt);
  }

  function addDataSubmitButton(addTo) {
    // Make a button that will submit the necessary data to the system.

    // Add the button
    d3.select(addTo)
      .append('button')
      .attr('class', 'btn btn-dark submit-button')
      .style('font', 'caption')
      .text('Submit')
      .on('click', onclickCallback);

    // Define the 'onclick' callback
    function onclickCallback() {
      var out = self.dataCompile();
      console.log(out);
      self.previewSelections(out);
    }
  }
}

SVGCanvas.prototype.dataCompile = function () {
  // A function for compiling all of the data on the canvas into a
  //  json data structure.
  // 
  // FUTURE: 
  //  More metadata
  //  Accomodate more than one image.
  var self = this;
  var out = [];

  // One file for each image (will have more in future).
  //// Initialize object
  var out_i = {
    meta: {},
    bb: {}
  };
  //// Get image bounding box.
  var imgBB = self.img.node().getBBox();
  // Get Metadata - Add more later.
  //// File name w/ path
  out_i.meta.href = self.img.attr('href');
  //// File size
  out_i.meta.height = self.img.data[0].height;
  out_i.meta.width = self.img.data[0].width;
  //// Common Name/Identifier
  // Get bounding boxes
  self.zoomG.selectAll('g.g-rect')
    .each(function (d, i) {
      // Retrieve rectangle bounding boxes _relative to image_.
      // Follows convention from VOC2008: 
      // http://host.robots.ox.ac.uk/pascal/VOC/voc2008/htmldoc/voc.html#SECTION00092000000000000000
      var d2 = {};
      d2.xmin = Math.max(d.x - imgBB.x, 0) / self.img.data[0].scale;
      d2.ymin = Math.max(d.y - imgBB.y, 0) / self.img.data[0].scale;
      d2.xmax = Math.min(d.x - imgBB.x + d.w, imgBB.width) / self.img.data[0].scale;
      d2.ymax = Math.min(d.y - imgBB.y + d.h, imgBB.height) / self.img.data[0].scale;
      d2.type = d.type;
      out_i.bb[d.id] = d2;
    });
  // Push onto full dataset.
  out.push(out_i);

  return out;
}

SVGCanvas.prototype.previewSelections = function (d) {
  // Make a table to preview the selections made above.
  var self = this;

  // Check the browser
  var brw = BrowserDetection();
  if (brw != "Chrome 1+") {
    alert('Switch to Chrome to see table selection images.');
  }

  // Load into a new window
  //// Open
  var w = window.open();
  //// Add styling
  w.document.write('<html><head><title>Data</title><link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous"></head><body>');
  //// Get the body.
  var b = d3.select(w.document.body);

  // Create Table and headers
  //// Table
  var tab = b
    .append('div')
    .attr('id', 'bb-preview-table')
    .append('table')
    .attr('class', 'table table-hover table-responsive');
  //// Headers
  var row = tab.append('thead').append('tr');
  row.append('th').text('Selection');
  row.append('th').text('Document');
  row.append('th').text('ID');
  row.append('th').text('Type');
  row.append('th').text('xmin');
  row.append('th').text('ymin');
  row.append('th').text('xmax');
  row.append('th').text('ymax');
  // Body
  var tbody = tab.append('tbody');

  // Cycle through output.
  for (var ii = 0; ii < d.length; ii++) {
    for (var bb in d[ii].bb) {

      // Get the data
      var d_i = d[ii].bb[bb];
      // Make the row
      var row = tbody.append('tr');
      // Browser-Specific
      if (brw == "Chrome 1+") {
        // Set the height and width
        var w = (d_i.xmax - d_i.xmin) * self.img.data[0].scale;
        var h = (d_i.ymax - d_i.ymin) * self.img.data[0].scale;
        // Append the image
        var canvas = row.append('td')
          .append('canvas')
          .attr('width', w)
          .attr('height', h);
        var ctx = canvas.node().getContext("2d");
        // ~~!!! ONLY WORKING ON CHROME !!!~~
        ctx.drawImage(self.img.node(),
          d_i.xmin, d_i.ymin,
          d_i.xmax - d_i.xmin, d_i.ymax - d_i.ymin,
          0, 0, w, h);
      } else {
        row.append('td').text('...');
      }
      // Append other info
      row.append('td').text(d[ii].meta.href);
      row.append('td').text(bb);
      row.append('td').text(d_i.type);
      row.append('td').text(d_i.xmin.toFixed(2));
      row.append('td').text(d_i.ymin.toFixed(2));
      row.append('td').text(d_i.xmax.toFixed(2));
      row.append('td').text(d_i.ymax.toFixed(2));
    }
  }
}

/***************
  Canvas Elements
***************/
SVGCanvas.prototype.addCanvas = function () {
  // Adding the canvas elements
  var self = this;

  // Make the main container SVG
  self.svg = d3.select(self.options.addTo + ' div.SVGCanvas-canvas')
    .append('svg')
    .attr('height', self.options.h)
    .attr('width', self.options.w)
    .attr('class', 'display-svg');

  // Add border if requested (last to be on top)
  if (self.options.addBorderRect) {
    self.svg.append('rect')
      .attr('height', '100%')
      .attr('width', '100%')
      .attr('stroke', 'black')
      .attr('stroke-width', 4)
      .attr('opacity', 0.25)
      .attr('fill-opacity', 0.0)
      .attr('class', 'border-rect')
      .attr('fill', 'none');
  }

  // Add image to background
  self.loadImage('./media/sample_table.png');

  // Raise border to top 
  // (do this last because border enforces canvas size)
  self.svg.select('rect.border-rect').raise();
}

SVGCanvas.prototype.loadImage = function (arg) {
  // Load an image to the canvas.
  var self = this;

  //// Add zoom and pan group
  self.zoomG = self.svg
    .append('g')
    .attr('class', 'zoom-group')
  //// Adding
  self.img = self.zoomG.append('image')
    .attr('href', arg)
    .attr('width', '98%')
    .attr('height', '98%')
    .attr('x', '1%')
    .attr('y', '1%')
    .call(function () {
      // Call this function to get size attributes for the  
      // displayed and actual image.
      var image = new Image();
      image.onload = function () {
        imgBB = self.img.node().getBBox();
        var d = {};
        d.height = image.naturalHeight;
        d.width = image.naturalWidth;
        // Get x/y coordinates and scaling:
        if (d.height > d.width) {
          d.scale = (imgBB.height / d.height);
          d.x = (self.options.w - d.scale * d.width) / 2;
          d.y = imgBB.y;
        } else {
          d.scale = (imgBB.width / d.width);
          d.x = imgBB.x;
          d.y = (self.options.h - d.scale * d.height) / 2;
        }
        // Reformat image attributes
        self.img
          .attr('width', d.scale * d.width)
          .attr('height', d.scale * d.height)
          .attr('x', d.x)
          .attr('y', d.y);
        // Assign as data
        self.img.data = [d];
      }
      image.src = arg;
    });

};

SVGCanvas.prototype.loadStateData = function () {
  return [{
      name: 'Table',
      color: '#d32f2f',
      count: 0,
      class: 'rect',
      id: 'Table-0',
    },
    {
      name: 'Row',
      color: '#303f9f',
      count: 0,
      class: 'rect',
      id: 'Row-0',
    },
    {
      name: 'Column',
      color: '#388e3c',
      count: 0,
      class: 'rect',
      id: 'Column-0',
    },
    {
      name: 'Title',
      color: '#512da8',
      count: 0,
      class: 'rect',
      id: 'Title-0',
    },
    {
      name: 'Note',
      color: '#fbc02d',
      count: 0,
      class: 'rect',
      id: 'Note-0',
    },
    {
      name: 'Number',
      color: '#e64a19',
      count: 0,
      class: 'rect',
      id: 'Number-0',
    },
    {
      name: 'Word',
      color: '#0288d1',
      count: 0,
      class: 'rect',
      id: 'Word-0',
    }];
}

/**********
    SETUP
**********/
window.onload = function () {
  options = {
    h: 380,
    w: 380,
    addTo: '.sample-div',
    addBorderRect: true,
    debug: false,
  }

  var c = new SVGCanvas(options);
}
