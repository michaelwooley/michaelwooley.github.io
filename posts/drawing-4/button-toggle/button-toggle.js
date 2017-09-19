/***********************
Button Toggling
************************/

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

function ButtonToggle(buttons, options) {
  //Toggling Button Group (SVG-based).
  //
  //  Inputs:
  //   - buttons: (Object) Information about buttons 
  //       to be added. Properties are:
  //     - name: (String) Name of the passed button. Used as both 
  //        button id and as label of button.
  //     - color: (String) Color of button. Defaults to colormap.
  //   - options: (Object) Information about button placement, etc.
  //       Properties are:
  //     - type: (String) Type of button group to add. Options are 
  //        ['button', 'dropdown']. (Default='button').
  //     - addTo: (String) CSS selector of where the button should 
  //         be placed. Should be within an <svg> element. (Default: 'svg')
  //     - groupName: (String) Name of button group. 
  //          (Defaults = 'buttont-toggle-[6-digit random integer]')
  //     - clickCall: (function) Function to be called when button 
  //        is clicked. Takes one argument, which is the id (name) of 
  //        the clicked button.
  //       
  //  Returns: 
  //    - A ButtonToggle object with methods.

  // Add properties
  this.buttons = buttons;
  this.type = options.type || 'button';
  this.addTo = options.addTo || 'svg';
  this.groupName = options.groupName || 'btn-group-' + getRandInt();
  this.buttonHeight = options.buttonHeight || 25;
  this.clickCall = options.clickCall || function () {
    null;
  };

  // Add the buttons
  if (this.type == 'dropdown') {
    this.addDropdown();
  } else {
    this.addButtons();
  }

}

ButtonToggle.prototype.addButtons = function () {
  // Add the buttons to the group
  var self = this;
  inactiveOpacity = 0.75;

  // Create the Button Group
  self.g = d3.select(self.addTo)
    .append('div')
    .attr('class', 'btn-group-vertical ' + this.groupName);

  function buttonClick() {
    // What should happen when the button is clicked?

    // Change active designation
    self.g
      .selectAll('label.active')
      .classed('active', false)
      .style('opacity', inactiveOpacity);

    var ab = d3.select(this)
      .classed('active', true)
      .style('opacity', 1);

    // Call the callback function
    self.clickCall(ab.attr('id'));
  }

  // Add the buttons
  for (var ii in self.buttons) {
    self.g
      .append('label')
      .attr('class', 'btn btn-secondary')
      .on('click', buttonClick)
      .text(self.buttons[ii].name)
      .attr('id', self.buttons[ii].name)
      .classed('active', ii == 0)
      .style('background-color', self.buttons[ii].color)
      .style('opacity', inactiveOpacity + (ii == 0) * (1 - inactiveOpacity))
      .style('border-color', 'white')
      .style('cursor', 'pointer')
      .style('color', 'white')
      .style('margin-bottom', '1%')
      .style('font', 'caption');
  }
}

ButtonToggle.prototype.addDropdown = function () {
  // Add as a dropdown element
  var self = this;

  // Add in div
  self.g = d3.select(self.addTo)
    .append('div')
    .attr('class', 'dropdown ' + self.groupName);

  self.b = self.g
    .append('button')
    .attr('class', 'btn btn-secondary dropdown-toggle')
    .attr('type', 'button')
    .attr('id', 'dropdownMenuButton')
    .attr('data-toggle', 'dropdown')
    .attr('aria-haspopup', 'true')
    .attr('aria-expanded', 'false')
    .text('Type: ' + self.buttons[0].name)
    .style('color', self.buttons[0].color)
    .style('text-align', 'left')
    .style('background-color', 'white')
    .style('font', 'caption');

  // Add the buttons group
  self.folder = self.g
    .append('div')
    .attr('class', 'dropdown-menu')
    .attr('aria-labelledby', 'dropdownMenuButton');
  
  // Add each button
  for (var ii in self.buttons) {
    self.folder
      .append('a')
      .attr('class', 'dropdown-item')
      .attr('id', self.buttons[ii].name)
      .style('opacity', 0.9)
      .style('color', self.buttons[ii].color)
      .style('cursor', 'pointer')
      .style('font', 'caption')
      .text(self.buttons[ii].name);
  }
  self.items = self.folder.selectAll('a.dropdown-item');

  // Add the actions
  //// Open/Close Top Button
  self.b
    .style('min-width', self.folder.style('min-width'))
    .on('click', function () {
    if (self.folder.style('display') == 'none') {
      self.folder.style('display', 'block');
    } else {
      self.folder.style('display', 'none');
    }
  });

  //// What should happen on click
  self.items.on('click', function () {
    var ab = d3.select(this);
    
    // Change the styling
    self.folder.style('display', 'none');
    self.b
      .style('color', ab.style('color'))
      .text('Type: ' + this.text);
    
    // Call the callback function
    self.clickCall(ab.attr('id'));
  })

}


/**********
Test
**********/
