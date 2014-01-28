(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DataWrapper, Enumerable, Path, _extend, _include;

Path = require("./path");

Enumerable = require("./wrappers/enumerable");

DataWrapper = (function() {
  function DataWrapper(value, path, parentWrapper) {
    this.value = value;
    this.path = path != null ? path : null;
    this.parentWrapper = parentWrapper != null ? parentWrapper : null;
    this._wrap();
  }

  DataWrapper.prototype.set = function(value) {
    return this._getRoot().update({
      sourceKey: this.sourceKey,
      value: value,
      path: this.getPath()
    });
  };

  DataWrapper.prototype.get = function(key) {
    return this.wrappers[key];
  };

  DataWrapper.prototype.getValue = function() {
    return this.value;
  };

  DataWrapper.prototype.getPath = function() {
    if (this.path != null) {
      return this.path.getPath();
    } else {
      return [];
    }
  };

  DataWrapper.prototype._getRoot = function() {
    if (this.parentWrapper != null) {
      return this.parentWrapper._getRoot();
    } else {
      return this;
    }
  };

  DataWrapper.prototype._wrap = function() {
    var i, key, path, val, _i, _len, _ref, _ref1, _results, _results1;
    this.wrappers = null;
    if (typeof this.value === "object") {
      if (this.value.constructor === Object) {
        this.wrappers = {};
        _ref = this.value;
        _results = [];
        for (key in _ref) {
          val = _ref[key];
          path = new Path(this.path, key);
          _results.push(this.wrappers[key] = new DataWrapper(val, path, this));
        }
        return _results;
      } else if (this.value.constructor === Array) {
        this.wrappers = [];
        _ref1 = this.value;
        _results1 = [];
        for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
          val = _ref1[i];
          path = new Path(this.path, i);
          _results1.push(this.wrappers.push(new DataWrapper(val, path, this)));
        }
        return _results1;
      }
    }
  };

  return DataWrapper;

})();

_extend = function(obj, mixin) {
  var method, name, _results;
  _results = [];
  for (name in mixin) {
    method = mixin[name];
    _results.push(obj[name] = method);
  }
  return _results;
};

_include = function(klass, mixins) {
  var mixin, _i, _len, _results;
  _results = [];
  for (_i = 0, _len = mixins.length; _i < _len; _i++) {
    mixin = mixins[_i];
    _results.push(_extend(klass.prototype, mixin));
  }
  return _results;
};

_include(DataWrapper, [Enumerable]);

module.exports = DataWrapper;

},{"./path":3,"./wrappers/enumerable":4}],2:[function(require,module,exports){
var Cortex, DataWrapper,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DataWrapper = require("./data_wrapper");

Cortex = (function(_super) {
  __extends(Cortex, _super);

  function Cortex(value, callback) {
    this.value = value;
    this.callback = callback;
    this._wrap();
  }

  Cortex.prototype.update = function(params) {
    this._setValue(params.value, params.path);
    this._wrap();
    if (this.callback) {
      return this.callback(this);
    }
  };

  Cortex.prototype._setValue = function(newValue, path) {
    var key, subValue, _i, _len, _ref;
    if (path.length > 1) {
      subValue = this.value;
      _ref = path.slice(0, +(path.length - 2) + 1 || 9e9);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        subValue = subValue[key];
      }
      return subValue[path[path.length - 1]] = newValue;
    } else if (path.length === 1) {
      return this.value[path[0]] = newValue;
    } else {
      return this.value = newValue;
    }
  };

  return Cortex;

})(DataWrapper);

if (typeof window !== "undefined" && window !== null) {
  window.Cortex = Cortex;
}

module.exports = Cortex;

},{"./data_wrapper":1}],3:[function(require,module,exports){
var Path;

Path = (function() {
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
var EnumerableWrapper;

EnumerableWrapper = {
  getLength: function() {
    return this.value.length;
  },
  forEach: function(callback) {
    var key, wrapper, _ref, _results;
    if (this.wrappers.constructor === Object) {
      _ref = this.wrappers;
      _results = [];
      for (key in _ref) {
        wrapper = _ref[key];
        _results.push(callback(key, wrapper));
      }
      return _results;
    } else if (this.wrappers.constructor === Array) {
      return this.wrappers.forEach(callback);
    }
  },
  map: function(callback) {
    return this.wrappers.map(callback);
  },
  find: function(callback) {
    var index, wrapper, _i, _len, _ref;
    _ref = this.wrappers;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      wrapper = _ref[index];
      if (callback(wrapper, index, this.wrappers)) {
        return wrapper;
      }
    }
    return null;
  },
  findIndex: function(callback) {
    var index, wrapper, _i, _len, _ref;
    _ref = this.wrappers;
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      wrapper = _ref[index];
      if (callback(wrapper, index, this.wrappers)) {
        return index;
      }
    }
    return -1;
  },
  push: function(value) {
    var length;
    length = this.value.push(value);
    this.set(this.value);
    return length;
  },
  pop: function() {
    var last;
    last = this.value.pop();
    this.set(this.value);
    return last;
  },
  insertAt: function(index, value) {
    var args;
    args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.value, args);
    return this.set(this.value);
  },
  removeAt: function(index, howMany) {
    var removed;
    if (howMany == null) {
      howMany = 1;
    }
    removed = this.value.splice(index, howMany);
    this.set(this.value);
    return removed;
  }
};

module.exports = EnumerableWrapper;

},{}]},{},[2])
