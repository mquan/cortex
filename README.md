Cortex is an immutable data store for managing deeply nested structure with React

**Key features:**
- supports deeply nested data
- uses immutable data, which allows fast comparison in `shouldComponentUpdate`
- very efficient batch updates
- simple APIs with built-in methods for working with arrays and hashes
- very lightweight (4.5kB minified and gzip)
- written in ES6

**Demos**

[skyline (4-level nested components)](https://mquan.github.io/cortex/examples/skyline/)

[file system (arbitrarily deep structure of a single component type)](https://mquan.github.io/cortex/examples/file_system/)

# Quickstart
Initialize a cortex object
```javascript
var data = {a: 100, b: [1, 2, 3]};

var cortex = new Cortex(data, function(updatedCortex) {
  //trigger React component to update props
  myComponent.setProps({cortex: updatedCortex});
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

Change data from root object
```javascript
cortex.set({a: 300})
cortex.getValue()
// ==> {a: 300}
```
* Note that new value is only available after `onUpdate` callback is run.

Add callbacks
```javascript
cortex.onUpdate(myCallback);
```

### ES6 Guide
Since React 0.13.0 removed `setProps` for ES6 React.Component class you have to define your cortex data as state instead

```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);

    // Assume you pass your data into props as myData
    var myCortex = new Cortex(props.myData, (updatedCortex) => {
      this.setState({myCortex: updatedCortex});
    });

    this.state = {myCortex: myCortex};
  }

  render() {
    // access cortex data from this.state.myCortex
  }
}
```

# Cortex 2.0 migration guide

The biggest change in v2 is immutable data. This allows us to implement `shouldComponentUpdate` as easy as

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return nextProps.myCortex !== this.props.myCortex;
}
```

Immutability also allows us to remove `getChanges` and `didChange` methods.

BREAKING CHANGES
- `on('update', callback)` is now simply onUpdate(callback)
- `off('update', callback)` is removed
- `insertAt` and `removeAt` are replaced by `splice`, which behaves the same way as `Array.prototype.splice`
- `add` is replaced by `merge`
- for aesthetic reason, `remove` and `destroy` are swapped. So you would call `remove(key)` to remove a nested child and call `destroy` to remove self.

# Overview

Cortex's main objective is to support arbitrarily deep data structure. Similar to the Flux pattern, it forces data to flow in one direction such that when an update occurs data is updated in one place, at the root, and allowed to propagate down the chain. Unlike Flux, however, Cortex does not require separate Action, Dispatcher, and Store entities.

Cortex is simply a store that works for updates at any level. It achieves this by utilizing cursors, which lets each nested node keep track of its path as accessed from the root. When an update occurs, the affected node emits an update event whose payload contains the path of the node as well as instructions on how to update the data at the root. Cortex's internal PubSub picks up the event and routes it to the affected root node. From there, every affected node is rewrapped and updated to maintain immutability while leaving all unaffected nodes untouched. This allows for extremely simple and efficient `shouldComponentUpdate` implementation.

Cortex allows components to manage their own data instead of defining global update ACTIONS. A deeply nested data structure can simply be passed into the parent Component, which then passes pieces of the data onto child components without worrying about how they are used.

Cortex also provides a few optimizations to help boost performance. First, Cortex will skip triggering React rerender when an update results in no actual data change. Secondly, Cortex batches all updates in a cycle into one call so that React is only triggered to render once. This is especially useful when updating multiple data nodes, such as data in an array.

# Basic example

The following example has two components, Order and Item. An Order contains an array of Items, and each Item can increase its own quantity attribute.

```javascript
var Item = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState) {
    nextProps.item !== this.props.item;
  },
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
  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.order !== this.props.order;
  },
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

orderCortex.onUpdate(function(updatedOrder) {
  orderComponent.setProps({order: updatedOrder});
});
```

First we initialize cortex with:
```javascript
var orderCortex = new Cortex(orderData);
```

Then it's passed into the Order component to render the Item components.

We set a callback to run on update event using
```
orderCortex.onUpdate(function(updatedOrder) {
  orderComponent.setProps({order: updatedOrder});
});
```

In Item component, note that we display the quantity value with ``this.props.item.quantity.getValue()``. This is because ``this.props.item.quantity`` only gives us the wrapper of the ``quantity`` attribute, we need to call ``getValue()`` to get the actual value.

In `increase` method, we use ``this.props.item.quantity.set(quantity + 1)`` to add 1 to the current quantity value.

Note that we implement `shouldComponentUpdate` by simply comparing the current and next props. This comparison is extremely fast since cortex returns a brand new immutable wrapper when data change.

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
    `set(value)`              | Changes the value and rewrap the subtree.
    `destroy()`               | Self destruct method: remove self from parent if nested, set value to undefined if root level.
    `onUpdate(callback)`      | Add a callback to run on update event (only available on root object)

### Cortex wrapper of array data has the following methods:

    Method                         | Description
    -------------------------------|:----------------------
    `count()`                      | Returns length of nested wrappers
    `forEach(callback)`            | Iterates over all elements. The callback accepts the following input `(wrapperElement, index, wrapperArray)`
    `map(callback)`                | Returns a new array as returned by the callback. Callback accepts same input as forEach callback
    `filter(callback, thisArg)`    | Returns a new array of wrappers whose elements satisfy condition return by callback.
    `find(callback)`               | Returns the first wrapper element that meets the condition returned by callback. Callback accepts same input as forEach callback.
    `findIndex(callback)`          | Returns index of first wrapper element that meets condition returned callback. Callback accepts same input as forEach callback.
    `push(value)`                  | Inserts and rewrap the value at the end of the array.
    `pop()`                        | Removes the last element in the array
    `unshift(value)`               | Inserts and rewrap the value at the front of the array.
    `shift()`                      | Removes the first element in the array
    `splice(index, removeCount, element1 [, element2, ...])`     | Remove `removeCount` from the array and insert elements into the array. This is similar to the native `Array.prototype.splice` method

### Cortex wrapper of hash data has the following methods:
    Methods                        | Description
    -------------------------------|:------------------------
    `keys()`                       | Returns the array of keys
    `values()`                     | Returns the array of values
    `hasKey(key)`                  | Returns boolean value whether the key exists
    `forEach(callback)`            | Iterates over every key and value pair. The callback accepts the following inputs `(key, wrapperElement)`
    `remove(key)`                 | Removes the specified key and value pair
    `merge({key1: value1[, key2: value2, ...]})`              | Adds/modifies the specified key and value pairs

# CDN

[cortex.2.0.2.js](https://cdn.rawgit.com/mquan/cortex/dc1fc8cf795828d24c2740ee48d10ecf0768320e/build/cortex.js)
[cortex.2.0.2.min.js](https://cdn.rawgit.com/mquan/cortex/dc1fc8cf795828d24c2740ee48d10ecf0768320e/build/cortex.min.js)


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

# Design & Optimizations

Besides providing the convenience of allowing you to update data from any level, Cortex also has several optimizations that help boost performance.

### 1. Deep comparison between old and new values

When you issue a `set(newValue)` call, no data actually changes at that point. What happens internally is the wrapper being called publishes a notification to the master cortex wrapper passing along a payload consisting of the path for locating the data and the new value (Yes, there is a pub/sub system within Cortex.) The root wrapper then performs a deep comparison between the old and new data to determine whether it should trigger the update action. If no change was made, the process just terminates without touching the data nor invoking the callbacks.

Deep comparison may sound costly but in practice when you call `set(newValue)` the newValue usually isn't deeply nested (if it is and the actual change is many layers deep then you should consider calling `set(newValue)` on the wrapper at the level that the change actually occurs.) In some situations where you have to pass in arbirarily deeply nested value the comparison work is still worth it because it can potentially save you from unnecessarily rewrapping and triggering React to update.


### 2. Batch rewrap and invoke callbacks once for multiple updates

When multiple updates occur at the same time, it will result in the same number of data rewrapping and callback invocations, which usually involve triggering React to update that same number of times. While React has good diffing algorithm for efficiently redrawing the DOM it would be even more efficient if React doesn't have to perform DOM comparison mutliple times. Cortex avoids triggering React by running callback only once for updates happening at the same time. This is especially useful when an array is being updated one element at a time or a deeply nested piece of data change at multiple levels.
