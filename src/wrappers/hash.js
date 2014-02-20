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

  delete: function(key) {
    var removed = this.__value[key];
    delete this.__value[key];
    this.__forceUpdate();
    return removed;
  },

  add: function(key, value) {
    this.__value[key] = value;
    this.__forceUpdate();
    return value;
  }
};

module.exports = HashWrapper;
