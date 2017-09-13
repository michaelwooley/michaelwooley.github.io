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
      self.transform.x = -(self.options.w * self.transform.k) + self.options.w;
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


SVGCanvas.prototype.transformRect = function () {
  var self = this;
  var groupClass, debug, g, r, p, dbWidth;

  var main = function () {

    r = self.Rect.r;
    g = self.Rect.g;
    dbWidth = self.options.rectOpt.dbWidth;
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

      activeG.each(
          function (d, i) {
            // Alter Parameters
            d.x = Math.max(0, Math.min(self.options.w - d.w, d.x + d3.event.dx));
            d.y = Math.max(0, Math.min(self.options.h - d.h, d.y + d3.event.dy));

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
          d.x = Math.max(0, Math.min(bb0.x + bb0.width, m[0]));
          d.y = Math.max(0, Math.min(bb0.y + bb0.height, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(self.options.w - d.x), Math.abs(bb0.x + bb0.width - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(self.options.h - d.y), Math.abs(bb0.y + bb0.height - m[1])) : d.h;
        },

        topright: function (d, bb0, m) {
          d.x = Math.max(0, Math.min(bb0.x, m[0]));
          d.y = Math.max(0, Math.min(bb0.y + bb0.height, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(self.options.w - d.x), Math.abs(bb0.x - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(self.options.h - d.y), Math.abs(bb0.y + bb0.height - m[1])) : d.h;
        },

        botleft: function (d, bb0, m) {
          d.x = Math.max(0, Math.min(bb0.x + bb0.width, m[0]));
          d.y = Math.max(0, Math.min(bb0.y, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(self.options.w - d.x), Math.abs(bb0.x + bb0.width - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(self.options.h - d.y), Math.abs(bb0.y - m[1])) : d.h;
        },

        botright: function (d, bb0, m) {
          d.x = Math.max(0, Math.min(bb0.x, m[0]));
          d.y = Math.max(0, Math.min(bb0.y, m[1]));
          d.w = (m[0] > 0) ? Math.min(Math.abs(self.options.w - d.x), Math.abs(bb0.x - m[0])) : d.w;
          d.h = (m[1] > 0) ? Math.min(Math.abs(self.options.h - d.y), Math.abs(bb0.y - m[1])) : d.h;
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
        m = d3.mouse(self.zoomG.node());
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


/**********
    SETUP
**********/
options = {
  h: 250,
  w: 250,
  addTo: '.sample-div',
  addBorderRect: true,
  debug: false,
}

var c = new SVGCanvas(options);

options2 = {
  h: 250,
  w: 250,
  addTo: '.sample-div-2',
  addBorderRect: true,
  debug: true,
}

var c2 = new SVGCanvas(options2);