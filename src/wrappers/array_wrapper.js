var ArrayWrapper = {
  count: function() {
    return this.__value.length;
  },

  map: function(callback, thisArg) {
    return this.__wrappers.map(callback, thisArg);
  },

  filter: function(callback, thisArg) {
    return this.__wrappers.filter(callback, thisArg);
  },

  find: function(callback) {
     for(var index = 0, length = this.__wrappers.length; index < length; index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return this.__wrappers[index];
      }
    }
    return undefined;
  },

  findIndex: function(callback) {
    for(var index = 0, length = this.__wrappers.length; index < length; index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return index;
      }
    }
    return -1;
  },

  // A limitation of these 'add' methods is it can only generate
  // one value change per diff
  // one way to improve is to create a new action 'concat'
  // that insert the array as multiple elements instead of treating
  // the array as a single element. This unwraps value as array and then add

  // add spec that push/unshift empty input
  // should not error
  // should not change anything
  push: function() {
    let values = Array.prototype.slice.call(arguments);
    var diffs = [];

    // Use -1 to indicate end of array because we don't mutate in-place
    // so there's no way to tell the current values in array.
    for (var i = 0, ii = values.length; i < ii; i++) {
      diffs.push({
        action: 'add',
        path: this.__path.concat(-1),
        value: values[i],
        force: true
      });
    }

    this.__notifyUpdate(diffs);
  },

  pop: function() {
    this.__forceUpdate('delete', -1);
  },

  unshift: function() {
    let values = Array.prototype.slice.call(arguments);
    var diffs = [];

    for (var i = 0, ii = values.length; i < ii; i++) {
      // Unshift so that the diffs come out in reverse order
      // making the last diffs showing up first in the array.
      diffs.unshift({
        action: 'add',
        path: this.__path.concat(0),
        value: values[i],
        force: true
      })
    }

    this.__notifyUpdate(diffs);
  },

  shift: function() {
    this.__forceUpdate('delete', 0);
  },

  splice: function(index, howMany = 1) {
    let values = Array.prototype.slice.call(arguments, 2);
    var diffs = [];

    // create delete diffs first.
    // Notice we don't specify index as index + i because
    // elements are deleted one at the time so it would always be
    // at the same index.
    for (var i = 0; i < howMany; i++) {
      diffs.push({
        action: 'delete',
        path: this.__path.concat(index),
        force: true
      });
    }

    // insert diffs
    for (var i = 0, ii = values.length; i < ii; i++) {
      diffs.push({
        action: 'add',
        path: this.__path.concat(index + i),
        value: values[i],
        force: true
      });
    }

    this.__notifyUpdate(diffs);
  }
};

module.exports = ArrayWrapper;
