var ArrayWrapper = {
  count: function() {
    return this.value.length;
  },

  map: function(callback) {
    return this.wrappers.map(callback);
  },

  find: function(callback) {
    for(var index = 0, length = this.wrappers.length;index < length;index++) {
      if(callback(this.wrappers[index], index, this.wrappers)) {
        return this.wrappers[index];
      }
    }
    return null;
  },

  findIndex: function(callback) {
    for(var index = 0, length = this.wrappers.length;index < length;index++) {
      if(callback(this.wrappers[index], index, this.wrappers)) {
        return index;
      }
    }
    return -1;
  },

  push: function(value) {
    var length = this.value.push(value);
    this._forceUpdate();
    return length;
  },

  pop: function() {
    var last = this.value.pop();
    this._forceUpdate();
    return last;
  },

  insertAt: function(index, value) {
    var args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.value, args);
    this._forceUpdate();
  },

  removeAt: function(index, howMany) {
    if(howMany == null) {
      howMany = 1;
    }
    var removed = this.value.splice(index, howMany);
    this._forceUpdate();
    return removed;
  }
};

module.exports = ArrayWrapper;
