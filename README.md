Cortex is a Javascript library for centrally managing data with React.

**Key features:**
- supports deeply nested data with a simple API
- performs old and new data comparison out of the box so you don't have to implement shouldComponentUpdate
- has built-in methods for working with arrays and hashes data

**Basic demos**

[skyline (4-level nested components)](http://mquan.github.io/cortex/examples/skyline/)

[file system (arbitrarily deep structure of a single component type)](http://mquan.github.io/cortex/examples/file_system/)

# Quickstart
Initialize a cortex object
```javascript
var data = {a: 100, b: [1, 2, 3]};

var cortex = new Cortex(data, function() {
  //trigger your React component to update props
});
```

Get a nested cortex object
```javascript
cortex.a

//Also works
cortex['a']
```

Get a nested cortex element in an array
```javascript
cortex.b[0]
```

Get the actual value
```javascript
cortex.a.getValue()
// ==> 100
```

Change data
```javascript
cortex.a.set(200);
cortex.a.getValue();
// ==> 200
```

Add callbacks
```javascript
cortex.on("update", myCallback);
```

Remove callback
```javascript
cortex.off("update", myCallback);
```

Remove all callbacks
```javascript
cortex.off("update");
```

# Overview

In React's world data flows in one direction from the top down. That means if you want to make a change, change it at the source and let it propagate down the chain. But what happen when a child component needs to update the data? React's official guideline is to use callback for communication between parent and child components.

However, this simply isn't sustainable even for trivially nested data. Imagine a Restaurant app in which the Restaurant has many Orders, each has many Items, each of which has many Modifiers. If you want to update a Modifier from 'medium rare' to 'well-done' you'd have to pass the data changes several levels up. This is not only awkward but also creates unnecessary extra code in each component in the chain only for the purpose of passing data upstream.

Cortex's goal is to support arbitrarily deep data structure without requiring you to pass callbacks down the chain. Cortex achieves this by thinly wrap your data in an object that contains the key for locating each nested piece of data as accessed from the top level. When you change the data, internally Cortex passes the new value along with its location key to update the data at the source.


# Basic example

The following example has two components Order and Item components. An Order contains an array of Items, and each Item can increase its own quantity attribute.

```javascript
var Item = React.createClass({
  increase: function() {
    var quantity = this.props.item.quantity.getValue();
    this.props.item.quantity.set(quantity + 1);
  },
  subTotal: function() {
    return this.props.item.quantity.getValue() * this.props.item.price.getValue();
  },
  render: function() {
    return(
      <div className="item">
        <a href="#" onClick={this.increase}>+</a>
        <span>{this.props.item.quantity.getValue()}</span>
        <span>{this.props.item.name.getValue()}</span>
        <span>${this.subTotal()}</span>
      </div>
    );
  }
});

var Order = React.createClass({
  render: function() {
    var items = this.props.order.map(function(item){
      return <Item item={item} />;
    });
    return(
      <div>{items}</div>
    );
  }
});

var orderData = [
      {name: "Burger", quantity: 2, price: 5.0},
      {name: "Salad", quantity: 1, price: 4.50},
      {name: "Coke", quantity: 3, price: 1.50}
    ];

//Initialize cortex with data and pass in a callback to run when data is updated.
var orderCortex = new Cortex(orderData);

var orderComponent = React.renderComponent(
  <Order order={orderCortex} />, document.getElementById("order")
);

orderCortex.on("update", function(updatedOrder) {
  orderComponent.setProps({order: orderCortex});
});
```

First we initialize cortex with:
```javascript
var orderCortex = new Cortex(orderData);
```

Then it's passed into the Order component to render the Item components.

We set a callback to run on update event using
```
orderCortex.on("update", function(updatedOrder) {
  orderComponent.setProps({order: orderCortex});
});
```

In Item component, note that we display the quantity value with ``this.props.item.quantity.getValue()``. This is because ``this.props.item.quantity`` only gives us the wrapper of the ``quantity`` attribute, we need to call ``getValue()`` to get the actual value.

In `increase` method, we use ``this.props.item.quantity.set(quantity + 1)`` to add 1 to the current quantity value.

# Cortex API

### Initialize:

```javascript
new Cortex(data, function() {
  //trigger your React component to update
});
```

### Instance methods:

    Method                    | Description
    --------------------------|:-------------------
    `getValue()`              | Returns the actual value
    `val()`                   | Alias for `getValue`
    `set(value)`              | Changes the value and rewrap the entire data tree
    `remove()`                | Self destruct method: remove self from parent if nested, set value to undefined if root level.
    `.on("update", callback)` | Add a callback to run on update event.
    `.off("update", callback)`| Remove a callback. If no callback is specified, all existing callbacks will be removed.

### Cortex wrapper of array data has the following methods:

    Method                         | Description
    -------------------------------|:----------------------
    `count()`                      | Returns length of nested wrappers
    `forEach(callback)`            | Iterates over all elements. The callback accepts the following input `(wrapperElement, index, wrapperArray)`
    `map(callback)`                | Returns a new array as returned by the callback. Callback accepts same input as forEach callback
    `find(callback)`               | Returns the first wrapper element that meets the condition returned by callback. Callback accepts same input as forEach callback.
    `findIndex(callback)`          | Returns index of first wrapper element that meets condition returned callback. Callback accepts same input as forEach callback.
    `push(value)`                  | Inserts and rewrap the value at the end of the array.
    `pop()`                        | Removes the last element in the array
    `unshift(value)`               | Inserts and rewrap the value at the front of the array.
    `shift()`                      | Removes the first element in the array
    `insertAt(index, [value])`     | Inserts a value or an array of values starting at specified index.
    `removeAt(index, howMany = 1)` | Removes specified number of elements starting at index location. By default it removes 1 element if number of elements to be removed isn't specified.

### Cortex wrapper of hash data has the following methods:
    Methods                        | Description
    -------------------------------|:------------------------
    `keys()`                       | Returns the array of keys
    `values()`                     | Returns the array of values
    `hasKey(key)`                  | Returns boolean value whether the key exists
    `forEach(callback)`            | Iterates over every key and value pair. The callback accepts the following inputs `(key, wrapperElement)`
    `destroy(key)`                 | Removes the specified key and value pair
    `add(key, value)`              | Adds the specified key and value pair


# Install via Bower
```console
bower install cortexjs
```

Reference the js file
```html
<script src="/bower_components/cortexjs/build/cortex.js"></script>
```

# Using cortex with node.js
Install via npm
```console
npm install cortexjs
```

Use it:
```javascript
Cortex = require("cortexjs");

wrappedData = new Cortex({mydata: 1});
console.log(wrappedData.mydata.getValue()); //1

wrappedData.mydata.set(100);
console.log(wrappedData.mydata.getValue()); //100
```

# Building Cortex
To build Cortex:
```console
gulp
```

To run test:
```console
gulp test
```

To compile jsx files in examples into js files:
```console
gulp react
```
