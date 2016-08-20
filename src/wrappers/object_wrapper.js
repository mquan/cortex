var ObjectWrapper = {
  keys: function() {
    return Object.keys(this.__value);
  },

  values: function() {
    var values = [];
    for (var key in this.__value) {
      values.push(this.__value[key]);
    }

    return values;
  },

  hasKey: function(key) {
    return this.__value[key] !== undefined;
  },

  remove: function(key) {
    if (key !== undefined && key !== null && this.hasKey(key))
      this.__wrappers[key].destroy();
  },

  merge: function(obj) {
    var diffs = [];
    for (var key in obj) {
      diffs.push({
        action: 'update',
        path: this.__path.concat(key),
        value: obj[key]
      });
    }

    this.__notifyUpdate(diffs);
  }
};

module.exports = ObjectWrapper;