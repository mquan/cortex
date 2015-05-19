var HashWrapper = {
  keys: function() {
    return Object.keys(this.__value);
  },

  values: function() {
    var key,
        values = [];
    for (key in this.__value) {
      values.push(this.__value[key]);
    }
    return values;
  },

  hasKey: function(key) {
    return this.__value[key] != null;
  },

  destroy: function(key) {
    var oldValue = this.constructor.deepClone(this.__value),
        removed = this.__value[key];
    delete this.__value[key];
    this.set(this.__value, {oldValue: oldValue});
    return removed;
  },

  add: function(key, value) {
    var oldValue = this.constructor.deepClone(this.__value);
    this.__value[key] = value;
    this.set(this.__value, {oldValue: oldValue});
    return value;
  }
};

module.exports = HashWrapper;
