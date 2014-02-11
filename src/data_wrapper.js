var Path = require("./path"),
ArrayWrapper = require("./wrappers/array"),
HashWrapper = require("./wrappers/hash"),

__include = function(klass, mixins) {
  for(var i=0,ii=mixins.length;i<ii;i++) {
    for(var methodName in mixins[i]) {
      klass.prototype[methodName] = mixins[i][methodName];
    }
  }
},

DataWrapper = (function(_mixins) {
  function DataWrapper(value, path, parentWrapper) {
    this.value = value;
    this.path = path;
    this.parentWrapper = parentWrapper;
    this._wrap();
  }

  DataWrapper.prototype.set = function(value, forceUpdate) {
    if(forceUpdate == null) {
      forceUpdate = false;
    }
    return this._getRoot().update(value, this.getPath(), forceUpdate);
  };

  DataWrapper.prototype.get = function(key) {
    return this.wrappers[key];
  };

  DataWrapper.prototype.getValue = function() {
    return this.value;
  };

  DataWrapper.prototype.getPath = function() {
    if(this.path != null) {
      return this.path.getPath();
    } else {
      return [];
    }
  };

  DataWrapper.prototype.forEach = function(callback) {
    if(this._isObject()) {
      for(var key in this.wrappers) {
        callback(key, this.wrappers[key], this.wrappers);
      }
    } else if(this._isArray()) {
      this.wrappers.forEach(callback);
    }
  };

  DataWrapper.prototype.remove = function() {
    if(this.parentWrapper) {
      if(this.parentWrapper._isObject()) {
        this.parentWrapper.delete(this.path.getKey());
      } else if(this.parentWrapper._isArray()) {
        this.parentWrapper.removeAt(this.path.getKey());
      }
    } else {
      delete this.value;
      delete this.wrappers;
    }
  };

  DataWrapper.prototype._getRoot = function() {
    if(this.parentWrapper != null) {
      return this.parentWrapper._getRoot();
    } else {
      return this;
    }
  };

  // Recursively wrap data if @value is a hash or an array.
  // Otherwise there's no need to further wrap primitive or other class instances
  DataWrapper.prototype._wrap = function() {
    delete this.wrappers;
    var path;
    if(this._isObject()) {
      this.wrappers = {};
      for(var key in this.value) {
        path = new Path(this.path, key);
        this.wrappers[key] = new DataWrapper(this.value[key], path, this);
      }
    } else if (this._isArray()) {
      this.wrappers = [];
      for(var i = 0, ii = this.value.length;i < ii; i++) {
        path = new Path(this.path, i);
        this.wrappers.push(new DataWrapper(this.value[i], path, this));
      }
    }
  };

  DataWrapper.prototype._forceSet = function() {
    this.set(this.value, true);
  };

  DataWrapper.prototype._isObject = function() {
    return this.value.constructor == Object;
  };

  DataWrapper.prototype._isArray = function() {
    return this.value.constructor == Array;
  };

  __include(DataWrapper, _mixins);

  return DataWrapper;
})([HashWrapper, ArrayWrapper]);

module.exports = DataWrapper;
