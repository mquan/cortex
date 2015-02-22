var ArrayWrapper = {
  count: function() {
    return this.__value.length;
  },

  map: function(callback) {
    return this.__wrappers.map(callback);
  },

  filter: function(callback, thisArg) {
    return this.__wrappers.filter(callback, thisArg);
  },

  find: function(callback) {
    for(var index = 0, length = this.__wrappers.length;index < length;index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return this.__wrappers[index];
      }
    }
    return null;
  },

  findIndex: function(callback) {
    for(var index = 0, length = this.__wrappers.length;index < length;index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return index;
      }
    }
    return -1;
  },

  push: function(value) {
    var oldValue = this.__clone(this.__value),
        length = this.__value.push(value);
    this.set(this.__value, {oldValue: oldValue});
    return length;
  },

  pop: function() {
    var oldValue = this.__clone(this.__value),
        last = this.__value.pop();
    this.set(this.__value, {oldValue: oldValue});
    return last;
  },

  unshift: function(value) {
    var oldValue = this.__clone(this.__value),
        length = this.__value.unshift(value);
    this.set(this.__value, {oldValue: oldValue});
    return length;
  },

  shift: function() {
    var oldValue = this.__clone(this.__value),
        last = this.__value.shift();
    this.set(this.__value, {oldValue: oldValue});
    return last;
  },

  insertAt: function(index, value) {
    var oldValue = this.__clone(this.__value),
        args = [index, 0].concat(value);

    Array.prototype.splice.apply(this.__value, args);
    this.set(this.__value, {oldValue: oldValue});
  },

  removeAt: function(index, howMany = 1) {
    var oldValue = this.__clone(this.__value),
        removed = this.__value.splice(index, howMany);

    this.set(this.__value, {oldValue: oldValue});
    return removed;
  }
};

module.exports = ArrayWrapper;
