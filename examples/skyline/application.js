/** @jsx React.DOM */

var Room = React.createClass({displayName: "Room",
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.room !== this.props.room;
  },
  toggleLight: function(e) {
    var current = this.props.room.light_on.getValue();
    this.props.room.light_on.set(!current);
    e.stopPropagation();
    e.preventDefault();
  },
  render: function() {
    var windowClasses = "window " + (this.props.room.light_on.getValue() ? "light-on" : "light-off");
    return(
      React.createElement("span", {className: "room"}, 
        React.createElement("a", {href: "#", className: windowClasses, onClick: this.toggleLight})
      )
    );
  }
});

var Floor = React.createClass({displayName: "Floor",
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.floor !== this.props.floor;
  },
  addRoom: function(e) {
    this.props.floor.rooms.push({light_on: true});
    e.stopPropagation();
  },
  render: function() {
    var rooms = this.props.floor.rooms.map(function(room) {
      return React.createElement(Room, {room: room});
    });
    return(
      React.createElement("div", {className: "floor", onClick: this.addRoom}, 
        rooms
      )
    );
  }
});

var Building = React.createClass({displayName: "Building",
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.building !== this.props.building;
  },
  addFloor: function(e) {
    var floors = this.props.building.floors.getValue(),
        newFloor = floors[0].rooms.map(function() {
          return {light_on: Math.floor(Math.random()*2) % 2 == 0};
        });
    this.props.building.floors.push({rooms: newFloor});
    e.stopPropagation();
    e.preventDefault();
  },
  render: function() {
    var floors = this.props.building.floors.map(function(floor) {
      return React.createElement(Floor, {floor: floor});
    });
    return(
      React.createElement("div", {className: "building-container"}, 
        React.createElement("div", {className: "building"}, 
          floors
        ), 
        React.createElement("a", {className: "add-floor", href: "#", onClick: this.addFloor}, "+")
      )
    );
  }
});

var City = React.createClass({displayName: "City",
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.city !== this.props.city;
  },
  addBuilding: function(e) {
    var newBuilding = createBuilding(5 + Math.floor(Math.random() * 10), 3);
    this.props.city.push(newBuilding);
    e.preventDefault();
    e.preventDefault();
  },
  removeBuilding: function(e) {
    this.props.city.pop();
    e.preventDefault();
    e.preventDefault();
  },
  render: function() {
    var buildings = this.props.city.map(function(building) {
      return React.createElement(Building, {building: building});
    });
    return(
      React.createElement("div", {className: "city-container"}, 
        buildings, 
        React.createElement("div", {className: "city-controls"}, 
          React.createElement("a", {href: "#", onClick: this.addBuilding}, "Add Building"), " |", 
          React.createElement("a", {href: "#", onClick: this.removeBuilding}, "Remove Building")
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

var cityComponent = React.render(
  React.createElement(City, {city: cortexData}), document.getElementById("city")
);

cortexData.onUpdate(function(updatedCortex) {
  cortexData = updatedCortex;
  cityComponent.setProps({city: updatedCortex});
});
