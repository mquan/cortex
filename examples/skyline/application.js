/** @jsx React.DOM */

var Room = React.createClass({displayName: 'Room',
  toggleLight: function(e) {
    var current = this.props.room.light_on.getValue();
    this.props.room.light_on.set(!current);
    return false;
  },
  render: function() {
    var windowClasses = "window " + (this.props.room.light_on.getValue() ? "light-on" : "light-off");
    return(
      React.DOM.span( {className:"room"}, 
        React.DOM.a( {href:"#", className:windowClasses, onClick:this.toggleLight})
      )
    );
  }
});

var Floor = React.createClass({displayName: 'Floor',
  addRoom: function(e) {
    this.props.floor.rooms.push({light_on: true});
    return false;
  },
  render: function() {
    var rooms = this.props.floor.rooms.map(function(room) {
      return Room( {room:room} );
    });
    return(
      React.DOM.div( {className:"floor", onClick:this.addRoom}, 
        rooms
      )
    );
  }
});

var Building = React.createClass({displayName: 'Building',
  addFloor: function(e) {
    var floors = this.props.building.floors.getValue(),
        newFloor = floors[0].rooms.map(function() {
          return {light_on: Math.floor(Math.random()*2) % 2 == 0};
        });
    this.props.building.floors.push({rooms: newFloor});
    return false;
  },
  render: function() {
    var floors = this.props.building.floors.map(function(floor) {
      return Floor( {floor:floor} );
    });
    return(
      React.DOM.div( {className:"building-container"}, 
        React.DOM.div( {className:"building"}, 
          floors
        ),
        React.DOM.a( {className:"add-floor", href:"#", onClick:this.addFloor}, "+")
      )
    );
  }
});

var City = React.createClass({displayName: 'City',
  addBuilding: function(e) {
    var newBuilding = createBuilding(5 + Math.floor(Math.random() * 10), 3);
    this.props.city.push(newBuilding);
    e.preventDefault();
  },
  removeBuilding: function(e) {
    this.props.city.pop();
    e.preventDefault();
  },
  render: function() {
    var buildings = this.props.city.map(function(building) {
      return Building( {building:building} );
    });
    return(
      React.DOM.div( {className:"city-container"}, 
        buildings,
        React.DOM.div( {className:"city-controls"}, 
          React.DOM.a( {href:"#", onClick:this.addBuilding}, "Add Building"), " | ",
          React.DOM.a( {href:"#", onClick:this.removeBuilding}, "Remove Building")
        )
      )
    );
  }
});

var createBuilding = function(floorsCount, roomsCount) {
  var building = {floors: []}
  for(var i=0, ii=floorsCount; i < ii; i++) {
    var rooms = [];
    for(var j=0, jj=roomsCount; j < jj; j++) {
      rooms.push({light_on: Math.floor(Math.random()*2) % 2 == 0});
    }
    building.floors.push({rooms: rooms});
  }

  return building;
};

var cityData = [{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":true},{"light_on":false},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":true},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":true},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":true},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":true},{"light_on":false},{"light_on":false},{"light_on":false},{"light_on":true}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]},{"floors":[{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]},{"rooms":[{"light_on":false},{"light_on":false},{"light_on":false}]}]}];

var cortexData = new Cortex(cityData);

var cityComponent = React.renderComponent(
  City( {city:cortexData} ), document.getElementById("city")
);

cortexData.on("update", function(updatedCortex) {
  cityComponent.setProps({city: updatedCortex});
});
