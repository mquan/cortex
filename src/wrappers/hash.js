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
    var removed = this.__value[key];
    delete this.__value[key];
    this.__forceUpdate();
    return removed;
  },

  'delete': function(key) {
    console.warn("Method deprecated! Please use .destroy(key) method");
    return this.remove(key);
  },

  add: function(key, value) {
    this.__value[key] = value;
    this.__forceUpdate();
    return value;
  }
};

module.exports = HashWrapper;
