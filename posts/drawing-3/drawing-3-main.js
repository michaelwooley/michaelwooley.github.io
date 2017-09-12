function SVGCanvas(options) {
  /*
   *  An SVG-based drawing app.
   *  Input:
   *   - options: An object consisting of:
   *    - h: The height of the canvas (default: 250px).
   *    - w: The width of the canvas (default: 250px).
   *    - addTo: CSS Selector for element on which to add canvas (default: 'body').
   *    - addBorderRect: (bool) Add a border around the canvas (default: true).
   *    - rectOpt: Options related to rectangle elements
   *      - dbWidth: Width of selection borders (default=9).
   *      - dsRadius: Radius of selection corners (default=4).
   *    - debug: (bool) run in debug mode (default=false).
   *  Returns: An SVG object contained in the `addTo` DOM element.
   */
  var self = this;
  // Define the global SVG options
  this.options = options || {};
  this.options.h = options.h || 250;
  this.options.w = options.w || 250;
  this.options.addTo = options.addTo || 'body';
  this.options.addBorderRect = options.addBorderRect || true;
  this.options.rectOpt = {
    dbWidth: 9,
    dsRadius: 4
  };
  this.options.debug = options.debug || false;

  // Set the state (elaborate on more later)
  this.state = {
    type: 'Table',
    color: '#d32f2f',
    count: 0,
    class: 'rect-table',
    id: 'Table-0',
  }

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
  //// Add zoom and pan group
  this.zoomG = this.svg
    .append('g')
    .attr('class', 'zoom-group');

  // Rectangles
  this.Rect = { // Current Selection
    'r': null,
    'g': null,
  };
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

    // Bottom border
    if (((-self.transform.y + self.options.h) / self.transform.k) > self.options.h) {
      self.transform.y = -(self.options.h * self.transform.k) + self.options.h;
    }

    // Top border
    if (((self.transform.y + 0) / self.transform.k) > 0) {
      self.transform.y = 0;
    }

    // Left border
    if (((-self.transform.x + self.options.w) / self.transform.k) > self.options.w) {
      self.transform.x = -(self.options.w * self.transform.k) + self.options.h;
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
  // var m = d3.event;
  // m.x = (-this.transform.x + m.x) / this.transform.k;
  // m.y = (-this.transform.y + m.y) / this.transform.k;
  return d3.mouse(this.zoomG.node());
}

SVGCanvas.prototype.makeAddRect = function () {
  // Methods for adding rectangles to the svg.
  var self = this;
  var x0, y0;

  start = function () {
    //Add a rectangle
    // 1. Get mouse location in SVG
    var m = self.mouseOffset();
    x0 = m[0];
    y0 = m[1];
    // 2. Add a new group
    self.Rect.g = self.zoomG
      .append('g')
      .attr('class', 'g-rect ' + self.state.id);
    // 3. Make a rectangle
    self.Rect.r = self.Rect.g
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
    self.Rect.r.attr('x', Math.min(x0, m[0]))
      .attr('y', Math.min(y0, m[1]))
      .attr('width', Math.abs(x0 - m[0]))
      .attr('height', Math.abs(y0 - m[1]));
  }
  end = function () {
    // What to do on mouseup
    // Add Rectangle Transformation Methods
    self.transformRect();
    // Clear out rect.
    self.Shapes[self.state.id] = self.Rect;
    // Update count and id
    self.state.count += 1;
    self.state.id = self.state.type + '-' + self.state.count;
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
function clone(selector) {
  // Clone a d3 selection. 
  // Source: https://stackoverflow.com/questions/39477740/copy-and-insert-in-d3-selection
  var node = d3.select(selector).node();
  return d3.select(node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling));
}

SVGCanvas.prototype.transformRect = function () {
  var self = this;
  var groupClass, debug, rectEdge, rectCorner, g, r, p, dbWidth;

  // Append helper rectEdges and rectCorners to g
  function makeRectEdgeCorner() {
    // Adds edges and corners to rectangle for drag move and resize.

    // "Prototype" elements
    var proto = [
    // Rectangular edges
    g.append('rect')
      .attr('class', 'rectEdge-rect cornerEdge ' + groupClass + debug)
      ,

    // Circular corners - NWSE cursor
    g.append('rect')
        .attr('height', dbWidth)
        .attr('width', dbWidth)
        .attr('id', 'topright')
        .attr('class', 'rectCorner-circ cornerEdge nwse ' + groupClass + debug)
        ,

    // Circular corners - NESW cursor
    g.append('rect')
        .attr('height', dbWidth)
        .attr('width', dbWidth)
        .attr('id', 'topright')
        .attr('class', 'rectCorner-circ cornerEdge nesw ' + groupClass + debug)
        ,
    ];

    // Create dict of edges
    rectEdge = {
      left: clone('.rectEdge-rect.' + groupClass),
      right: clone('.rectEdge-rect.' + groupClass),
      top: clone('.rectEdge-rect.' + groupClass),
      bottom: clone('.rectEdge-rect.' + groupClass),
    };

    // Create Dict of corners
    rectCorner = {
      topleft: clone('.nwse.' + groupClass).attr('id', 'topleft'),
      topright: clone('.nesw.' + groupClass).attr('id', 'topright'),
      botleft: clone('.nesw.' + groupClass).attr('id', 'botleft'),
      botright: clone('.nwse.' + groupClass).attr('id', 'botright'),
    };

    // Remove prototype elements from DOM
    proto.forEach(function (d, i) {
      d.remove();
    });

    // Format size and shape of added objects.
    setCoords();

    return rectEdge, rectCorner;
  }

  function setCoords() {

    // X Coordinates
    r.attr('x', p.x);
    rectEdge.left.attr('x', p.x - (dbWidth / 2));
    rectEdge.right.attr('x', p.x + p.w - (dbWidth / 2));
    rectEdge.top.attr('x', p.x + (dbWidth / 2));
    rectEdge.bottom.attr('x', p.x + (dbWidth / 2));
    rectCorner.topleft.attr('x', p.x - (dbWidth / 2));
    rectCorner.topright.attr('x', p.x + p.w  - (dbWidth / 2));
    rectCorner.botleft.attr('x', p.x  - (dbWidth / 2));
    rectCorner.botright.attr('x', p.x + p.w  - (dbWidth / 2));
    
    // Widths
    r.attr('width', p.w);
    rectEdge.left.attr('width', dbWidth);
    rectEdge.right.attr('width', dbWidth);
    rectEdge.top.attr('width', Math.abs(p.w - dbWidth));
    rectEdge.bottom.attr('width', Math.abs(p.w - dbWidth));

    // Y Coordinates
    r.attr('y', p.y);
    rectEdge.left.attr('y', p.y + (dbWidth / 2));
    rectEdge.right.attr('y', p.y + (dbWidth / 2));
    rectEdge.top.attr('y', p.y - (dbWidth / 2));
    rectEdge.bottom.attr('y', p.y + p.h - (dbWidth / 2));
    rectCorner.topleft.attr('y', p.y - (dbWidth / 2));
    rectCorner.topright.attr('y', p.y - (dbWidth / 2));
    rectCorner.botleft.attr('y', p.y + p.h - (dbWidth / 2));
    rectCorner.botright.attr('y', p.y + p.h - (dbWidth / 2));
    
    // Heights
    r.attr('height', p.h);
    rectEdge.left.attr('height', Math.abs(p.h - dbWidth));
    rectEdge.right.attr('height', Math.abs(p.h - dbWidth));
    rectEdge.top.attr('height', dbWidth);
    rectEdge.bottom.attr('height', dbWidth);
  }

  // Add move and resize methods
  function moveRect() {
    // Move the rectangle by dragging edges

    function start() {
      p = g.datum();
      self.setActive(groupClass);
      self.svg.style('cursor', 'move');
    }
    
    function drag() {

      // Alter Parameters
      p.x = Math.max(0, Math.min(self.options.w - p.w, p.x + d3.event.dx));
      p.y = Math.max(0, Math.min(self.options.h - p.h, p.y + d3.event.dy));

      // Set Coordinates
      setCoords();
    }

    function end() {
      // Undo formatting
      self.svg.style('cursor', 'default');
      g.data()[0] = p;
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
    var bb0, id, m, dragCorners;

    function getDragCorners() {
      return {
        topleft: function () {
          p.x = Math.max(0, Math.min(bb0.x + bb0.width, m.x));
          p.y = Math.max(0, Math.min(bb0.y + bb0.height, m.y));
          p.w = (m.x > 0) ? Math.min(Math.abs(self.options.w - p.x), Math.abs(bb0.x + bb0.width - m.x)) : p.w;
          p.h = (m.y > 0) ? Math.min(Math.abs(self.options.h - p.y), Math.abs(bb0.y + bb0.height - m.y)) : p.h;
        },

        topright: function () {
          p.x = Math.max(0, Math.min(bb0.x, m.x));
          p.y = Math.max(0, Math.min(bb0.y + bb0.height, m.y));
          p.w = (m.x > 0) ? Math.min(Math.abs(self.options.w - p.x), Math.abs(bb0.x - m.x)) : p.w;
          p.h = (m.y > 0) ? Math.min(Math.abs(self.options.h - p.y), Math.abs(bb0.y + bb0.height - m.y)) : p.h;
        },

        botleft: function () {
          p.x = Math.max(0, Math.min(bb0.x + bb0.width, m.x));
          p.y = Math.max(0, Math.min(bb0.y, m.y));
          p.w = (m.x > 0) ? Math.min(Math.abs(self.options.w - p.x), Math.abs(bb0.x + bb0.width - m.x)) : p.w;
          p.h = (m.y > 0) ? Math.min(Math.abs(self.options.h - p.y), Math.abs(bb0.y - m.y)) : p.h;
        },

        botright: function () {
          p.x = Math.max(0, Math.min(bb0.x, m.x));
          p.y = Math.max(0, Math.min(bb0.y, m.y));
          p.w = (m.x > 0) ? Math.min(Math.abs(self.options.w - p.x), Math.abs(bb0.x - m.x)) : p.w;
          p.h = (m.y > 0) ? Math.min(Math.abs(self.options.h - p.y), Math.abs(bb0.y - m.y)) : p.h;
        }
      };
    }
    
    function start() {
      // Parameter data
      p = g.datum();
      // Get corner id
      id = d3.select(this).attr('id');
      // Get the initial Bounding Box
      bb0 = r.node().getBBox();
      // Set active
      self.setActive(groupClass, true);
      // Display correct cursor tip
      var cursor = d3.select(this).classed('nwse') ? 'nwse-resize' : 'nesw-resize';
      self.svg.style('cursor', cursor);
      // Update dragCorners
      dragCorners = getDragCorners();
    }

    var drag = function () {
      // Mouse position
      m = d3.event;
      // Update parameters depending on id
      dragCorners[id]();
      // Set the coordinates
      setCoords();
    }

    var end = function () {
      // Undo formatting
      self.svg.style('cursor', 'default');
      // Parameter data
      g.data()[0] = p;
    }

    var dragcontainer = d3.drag()
      .on('start', start)
      .on('drag', drag)
      .on('end', end);

    return {
      drag: dragcontainer,
    }
  }

  var main = function () {

    r = self.Rect.r;
    g = self.Rect.g;
    dbWidth = self.options.rectOpt.dbWidth;
    // Set common class
    groupClass = self.state.id;
    debug = self.options.debug ? (' debug') : ('');
    
    // Get parameter data
    var rBB = r.node().getBBox();
    p = {
      x: rBB.x,
      y: rBB.y,
      w: rBB.width,
      h: rBB.height,
    };
    g = g.data([p]);

    // Make methods
    var move = moveRect();
    var resize = resizeRect();

    rectEdge, rectCorner = makeRectEdgeCorner();

    // Add properties to edges and corners
    rectEdge.left.call(move.drag);
    rectEdge.right.call(move.drag);
    rectEdge.top.call(move.drag);
    rectEdge.bottom.call(move.drag);

    rectCorner.topleft.call(resize.drag);
    rectCorner.topright.call(resize.drag);
    rectCorner.botleft.call(resize.drag);
    rectCorner.botright.call(resize.drag);
  }

  main();
}

SVGCanvas.prototype.setActive = function (id, force_clear = false) {
  // Sets class to active for selected groups.
  
  // If ctrl not pressed, deactivate all others.
  if (!d3.event.sourceEvent.ctrlKey || force_clear) {
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


/**********
    SETUP
**********/
options = {
  h: 350,
  w: 350,
  addTo: '.sample-div',
  addBorderRect: true,
  debug: false,
}

var c = new SVGCanvas(options);
