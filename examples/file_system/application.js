/** @jsx React.DOM */

var Node = React.createClass({displayName: "Node",
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.node !== this.props.node ||
           nextState.editing !== this.state.editing ||
           nextState.editText !== this.state.editText;
  },
  getInitialState: function() {
    return {editing: false, editText: ""};
  },
  edit: function() {
    this.setState({editing: true, editText: this.props.node.name.getValue()});
  },
  handleChange: function(event) {
    this.setState({editText: event.target.value});
  },
  update: function(event) {
    if(event.keyCode === 13) {
      this.setState({editing: false});
      this.props.node.name.set(event.target.value);
    }
  },
  render: function() {
    var nodeType, nodes, commands;
    var nameClass = React.addons.classSet({
      "node-name": true,
      "hide": this.state.editing
    });

    var editClass = React.addons.classSet({
      "edit-name": true,
      "hide": !this.state.editing
    });

    if (this.props.node.children) {
      nodeType = "folder";
      nodes = this.props.node.children.map(function(node) {
        return React.createElement(Node, {node: node});
      });
    } else {
      nodeType = "file";
    }

    return(
      React.createElement("div", {className: nodeType}, 
        React.createElement("span", {className: "icon"}), 
        React.createElement("span", {className: nameClass, onDoubleClick: this.edit}, 
          this.props.node.name.getValue()
        ), 
        React.createElement("input", {className: editClass, 
               value: this.state.editText, 
               onChange: this.handleChange, 
               onKeyUp: this.update}), 
        nodes
      )
    );
  }
});

var data = {name: "Desktop", children: [
  {name: "Applications", children: [
    {name: "Chrome"}, {name: "VLC"}, {name: "Mail"}
  ]},
  {name: "Media", children: [
    {name: "Photos", children: [
      {name: "By locations", children: [
        {name: "United States", children: [
          {name: "California", children: [
            {name: "San Francisco", children: [
              {name: "Mission", children: [
                {name: "delores.jpg"}, {name: "valencia.jpg"}, {name: "birite.png"}
              ]}
            ]}
          ]}
        ]}
      ]}
    ]},
    {name: "Videos", children: [
      {name: "movie1.mov"}, {name: "movie2.mov"}
    ]}
  ]},
  {name: "readme.txt"},
]};

var cortexData = new Cortex(data);
var fileSystemComponent = React.render(
  React.createElement(Node, {node: cortexData}), document.getElementById("filesystem")
);

cortexData.onUpdate(function(updatedCortex) {
  fileSystemComponent.setProps({node: updatedCortex});
});
