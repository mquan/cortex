var HashWrapper = {
  keys: function() {
    return Object.keys(this.value);
  },

  values: function() {
    var key,
        values = [];
    for (key in this.value) {
      values.push(this.value[key]);
    }
    return values;
  },

  hasKey: function(key) {
    return this.value[key] != null;
  },

  delete: function(key) {
    var removed = this.value[key];
    delete this.value[key];
    this.set(this.value, true);
    return removed;
  }
};

module.exports = HashWrapper;
