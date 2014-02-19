var cortexPubSub = require("./pubsub"),
ArrayWrapper = require("./wrappers/array"),
HashWrapper = require("./wrappers/hash"),
DataWrapper = require("./data_wrapper")([ArrayWrapper, HashWrapper], cortexPubSub),
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

Cortex = (function(_super, _cortexPubSub) {
  function Cortex(value, callback) {
    this.value = value;
    this.path = [];
    this.callback = callback;
    this._subscribe();
    this._wrap();
  }

  __extends(Cortex, _super);

  Cortex.prototype.update = function(newValue, path, forceUpdate) {
    if(!forceUpdate && !this._shouldUpdate(newValue, path)) {
      return false;
    }

    this._setValue(newValue, path);
    this._wrap();
    if(this.callback) {
      return this.callback(this);
    }
  };

  Cortex.prototype._subscribe = function() {
    this.eventId = _cortexPubSub.subscribeToCortex((function(topic, data) {
      this.update(data.value, data.path, data.forceUpdate);
    }).bind(this), (function(topic, data) {
      this._remove(data.path);
    }).bind(this));
  };

  Cortex.prototype._remove = function(path) {
    if(path.length) {
      var subPath = path.slice(0, path.length -1),
          subValue = this._subValue(subPath),
          key = path[path.length - 1],
          removed = subValue[key];
      if(subValue.constructor == Object) {
        delete subValue[key];
      } else if(subValue.constructor == Array) {
        subValue.splice(key, 1);
      }
      this.update(subValue, subPath, true);
      return removed;
    } else {
      delete this.wrappers;
      delete this.value;
    }
  };

  Cortex.prototype._setValue = function(newValue, path) {
    /*
      When saving an object to a variable it's pass by reference, but when doing so for a primitive value
      it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
      than 2 (meaning it can't never be a primitive). When path length is 0 or 1 we set the value directly.
    */
    if(path.length > 1) {
      var subValue = this._subValue(path.slice(0, path.length - 1));
      subValue[path[path.length-1]] = newValue;
    } else if(path.length == 1) {
      this.value[path[0]] = newValue;
    } else {
      this.value = newValue;
    }
  };

  Cortex.prototype._subValue = function(path) {
    var subValue = this.value;
    for(var i=0, ii = path.length;i<ii;i++) {
      subValue = subValue[path[i]];
    }
    return subValue;
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
})(DataWrapper, cortexPubSub);

if(typeof window !== "undefined" && window !== null) {
  window.Cortex = Cortex;
}

module.exports = Cortex;
