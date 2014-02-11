(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./path":3,"./wrappers/array":4,"./wrappers/hash":5}],2:[function(require,module,exports){
var DataWrapper = require("./data_wrapper"),
__hasProp = {}.hasOwnProperty,
__extends = function(child, parent) {
  for (var key in parent) {
    if (__hasProp.call(parent, key))
      child[key] = parent[key];
  }
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
},

Cortex = (function(_super) {
  __extends(Cortex, _super);

  function Cortex(value, callback) {
    this.value = value;
    this.callback = callback;
    this._wrap();
  }

  Cortex.prototype.update = function(newValue, path, forceUpdate) {
    if(forceUpdate == null) {
      forceUpdate = false;
    }

    if(!forceUpdate && !this._shouldUpdate(newValue, path)) {
      return false;
    }

    this._setValue(newValue, path);
    this._wrap();
    if(this.callback) {
      return this.callback(this);
    }
  };

  Cortex.prototype._setValue = function(newValue, path) {
    /*
      When saving an object to a variable it's pass by reference, but when doing so for a primitive value
      it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
      than 2 (meaning it can't never be a primitive). When path length is 0 or 1 we set the value directly.
    */
    if(path.length > 1) {
      var key,
          subValue = this.value;
      for(var i=0, ii = path.length-1;i<ii;i++) {
        subValue = subValue[path[i]];
      }
      subValue[path[path.length-1]] = newValue
    } else if(path.length == 1) {
      this.value[path[0]] = newValue;
    } else {
      this.value = newValue;
    }
  };

  // Check whether newValue is different, if not then return false to bypass rewrap and running callback.
  Cortex.prototype._shouldUpdate = function(newValue, path) {
    var oldValue = this.value;
    for(var i=0, ii=path.length;i<ii;i++) {
      oldValue = oldValue[path[i]];
    }
    return this._isDifferent(oldValue, newValue);
  };

  // Recursively performs comparison b/w old and new data
  Cortex.prototype._isDifferent = function(oldValue, newValue) {
    if(oldValue.constructor == Object) {
      if(newValue.constructor != Object ||
          this._isDifferent(Object.keys(oldValue).sort(), Object.keys(newValue).sort())) {
        return true;
      }
      for(var key in oldValue) {
        if(this._isDifferent(oldValue[key], newValue[key])) {
          return true;
        }
      }
    } else if(oldValue.constructor == Array) {
      if(newValue.constructor != Array || oldValue.length != newValue.length) {
        return true;
      }
      for(var i=0, ii=oldValue.length;i<ii;i++) {
        if(this._isDifferent(oldValue[i], newValue[i])) {
          return true;
        }
      }
    } else {
      return oldValue != newValue;
    }
  };

  return Cortex;
})(DataWrapper);

if(typeof window !== "undefined" && window !== null) {
  window.Cortex = Cortex;
}

module.exports = Cortex;

},{"./data_wrapper":1}],3:[function(require,module,exports){
var Path = (function() {
  function Path(parent, key) {
    this.parent = parent;
    this.key = key;
  }

  Path.prototype.getKey = function() {
    return this.key;
  };

  Path.prototype.getParent = function() {
    return this.parent;
  };

  Path.prototype.getPath = function(path) {
    if (path == null) {
      path = [];
    }
    path.splice(0, 0, this.key);
    if (this.parent != null) {
      return this.parent.getPath(path);
    } else {
      return path;
    }
  };

  return Path;
})();

module.exports = Path;

},{}],4:[function(require,module,exports){
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
    this._forceSet();
    return length;
  },

  pop: function() {
    var last = this.value.pop();
    this._forceSet();
    return last;
  },

  insertAt: function(index, value) {
    var args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.value, args);
    this._forceSet();
  },

  removeAt: function(index, howMany) {
    if(howMany == null) {
      howMany = 1
    }
    var removed = this.value.splice(index, howMany);
    this._forceSet();
    return removed;
  }
};

module.exports = ArrayWrapper;

},{}],5:[function(require,module,exports){
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

},{}]},{},[2])