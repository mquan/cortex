Cortex is a Javascript library for centrally managing React data.


# Overview

In React's world data flows in one direction from the top down. That means if you want to make a change, change it at the source and let it propagate down the chain. But what happen when a child component wants to update the data? React's official guideline is to use callback for communication between parent and child components.

However, this simply isn't sustainable even for trivially nested data. Imagine a Restaurant app in which the Restaurant has many Orders, each has many Items, each of which has many Modifiers. If you want to update a Modifier from 'medium rare' to 'well-done' you'd have to pass the data several levels up. This is not only awkward but also creates unnecessary extra code in each component in the chain only for the purpose of passing data upstream.

Cortex's goal is to support arbitrarily deep data without requiring you to pass callbacks down the chain while complying to React one-direction data flow. Cortex achieves this by thinly wrap your data in an object that contains the key for locating each nested piece of data as accessed from the top level. When you change the data, internally Cortex passes the new value along with its location key to update the data at the source.


# Basic example

Let's look at the following example for Order and Item components. An Order contains an array of Items, and each Item can increase its own quantity attribute.

```javascript
var Item = React.createClass({
  increase: function() {
    var qty = this.props.item.get('qty').getValue();
    this.props.item.get('qty').set(qty + 1);
  },
  subTotal: function() {
    return this.props.item.get('qty').getValue() * this.props.item.get('price').getValue();
  },
  render: function() {
    <div className="item">
      <a href="#" onClick={this.increase}>+</a>
      <span>{this.props.item.get('qty').getValue()}</span>
      <span>{this.props.item.get('name').getValue()}</span>
      <span>${this.subTotal()}</span>
    </div>
  }
});

var Order = React.createClass({
  render: function() {
    var items = this.props.order.map(function(item){
      return <Item item={item} />;
    });
    <div>
      {items}
    </div>
  }
});

var orderComponent,
    orderData = [
      {name: "Burger", qty: 2, price: 5.0},
      {name: "Salad", qty: 1, price: 4.50},
      {name: "Coke", qty: 3, price: 1.50}
    ];

//Initialize cortex with data and pass in a callback to run when data is updated.
var orderCortex = new Cortex(orderData, function(updatedOrder) {
  orderComponent.setProps({order: orderCortex});
});

orderComponent = React.renderComponent(
  <Order order={orderCortex} />, document.getElementById("order")
);
```

In the above example, we initialize cortex with:
```javascript
var orderCortex = new Cortex(orderData, function(updatedOrder) {
  orderComponent.setProps({order: orderCortex});
});
```

Then it is passed into the Order component, which is then used to render the array of Item components.

In Item component, note that we display the values with ``this.props.item.get('qty').getValue()`` and ``this.props.item.get('name').getValue()``. This is because ``this.props.item.get('qty')`` only gives us the wrapper of the ``qty`` attribute, we need to call ``getValue()`` to get the actual value.

In the `increase()` method, we use ``this.props.item.get('qty').set(qty + 1)`` to add 1 to the current qty value.

# Cortex API

### Initialize:

```javascript
new Cortex(data, function() {
  //trigger your React component to update
});
```

### Instance methods:

    Method         | Description
    ---------------|:-------------------
    `get(key)`     | Returns the wrapper object for the provided key
    `getValue()`   | Returns the actual value
    `set(value)`   | Changes the value and rewrap the entire data tree

### Cortex wrapper of enumerable data has the following methods:

    Method                         | Description
    -------------------------------|:----------------------
    `getLength()`                  | Returns length of nested wrappers
    `forEach(callback)`            | Iterates over all elements. The callback accepts the following input `(wrapperElement, index, wrapperArray)`
    `map(callback)`                | Returns a new array as returned by the callback. Callback accepts same input as forEach callback
    `find(callback)`               | Returns the first wrapper element that meets the condition returned by callback. Callback accepts same input as forEach callback.
    `findIndex(callback)`          | Returns index of first wrapper element that meets condition returned callback. Callback accepts same input as forEach callback.
    `push(value)`                  | Inserts and rewrap the value at the end of the array.
    `pop()`                        | Removes the last element in the array
    `insertAt(index, [value])`     | Inserts a value or an array of values starting at specified index.
    `removeAt(index, howMany = 1)` | Removes specified number of elements starting at index location. By default it removes 1 element if number of elements to be removed isn't specified.


# Buidling Cortex
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
