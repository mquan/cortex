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
    this.__value = value;
    this.__path = [];
    this.__callbacks = callback ? [callback] : [];
    this.__subscribe();
    this.__wrap();
  }

  __extends(Cortex, _super);

  Cortex.prototype.on = function(eventName, callback) {
    if(eventName === "update") {
      this.__callbacks.push(callback);
    }
  };

  Cortex.prototype.off = function(eventName, callback) {
    if(eventName === "update") {
      if(callback) {
        for(var i=0, ii=this.__callbacks.length;i < ii;i++) {
          if(callback === this.__callbacks[i]) {
            this.__callbacks.splice(i, 1);
            break;
          }
        }
      } else {
        this.__callbacks = [];
      }
    }
  };

  Cortex.prototype.update = function(newValue, path, forceUpdate) {
    if(!forceUpdate && !this.__shouldUpdate(newValue, path)) {
      return false;
    }

    this.__setValue(newValue, path);
    this.__rewrap(path);

    for(var i=0, ii=this.__callbacks.length;i < ii;i++) {
      if(this.__callbacks[i]) {
        this.__callbacks[i](this);
      }
    }

    return true;
  };

  Cortex.prototype.__subscribe = function() {
    this.__eventId = _cortexPubSub.subscribeToCortex((function(topic, data) {
      this.update(data.value, data.path, data.forceUpdate);
    }).bind(this), (function(topic, data) {
      this.__remove(data.path);
    }).bind(this));
  };

  Cortex.prototype.__remove = function(path) {
    if(path.length) {
      var subPath = path.slice(0, path.length -1),
          subValue = this.__subValue(subPath),
          key = path[path.length - 1],
          removed = subValue[key];
      if(subValue.constructor === Object) {
        delete subValue[key];
      } else if(subValue.constructor === Array) {
        subValue.splice(key, 1);
      }
      this.update(subValue, subPath, true);
      return removed;
    } else {
      delete this.__wrappers;
      delete this.__value;
    }
  };

  // Re-wrap starting at the parent of the subtree of target node.
  Cortex.prototype.__rewrap = function(path) {
    var subPath = path.slice(0, path.length - 1),
        subWrapper = this;
    for(var i=0, ii = subPath.length;i<ii;i++) {
      subWrapper = subWrapper[subPath[i]];
    }
    subWrapper.__wrap();
  };

  Cortex.prototype.__setValue = function(newValue, path) {
    /*
      When saving an object to a variable it's pass by reference, but when doing so for a primitive value
      it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
      than 2 (meaning it can't never be a primitive). When path length is 0 or 1 we set the value directly.
    */
    if(path.length > 1) {
      var subValue = this.__subValue(path.slice(0, path.length - 1));
      subValue[path[path.length-1]] = newValue;
    } else if(path.length === 1) {
      this.__value[path[0]] = newValue;
    } else {
      this.__value = newValue;
    }
  };

  Cortex.prototype.__subValue = function(path) {
    var subValue = this.__value;
    for(var i=0, ii = path.length;i<ii;i++) {
      subValue = subValue[path[i]];
    }
    return subValue;
  };

  // Check whether newValue is different, if not then return false to bypass rewrap and running callback.
  Cortex.prototype.__shouldUpdate = function(newValue, path) {
    var oldValue = this.__value;
    for(var i=0, ii=path.length;i<ii;i++) {
      oldValue = oldValue[path[i]];
    }
    return this.__isDifferent(oldValue, newValue);
  };

  // Recursively performs comparison b/w old and new data
  Cortex.prototype.__isDifferent = function(oldValue, newValue) {
    if(oldValue && oldValue.constructor === Object) {
      if(!newValue || newValue.constructor !== Object ||
          this.__isDifferent(Object.keys(oldValue).sort(), Object.keys(newValue).sort())) {
        return true;
      }
      for(var key in oldValue) {
        if(this.__isDifferent(oldValue[key], newValue[key])) {
          return true;
        }
      }
    } else if(oldValue && oldValue.constructor === Array) {
      if(!newValue || newValue.constructor !== Array || oldValue.length !== newValue.length) {
        return true;
      }
      for(var i=0, ii=oldValue.length;i<ii;i++) {
        if(this.__isDifferent(oldValue[i], newValue[i])) {
          return true;
        }
      }
    } else {
      return oldValue !== newValue;
    }
  };

  return Cortex;
})(DataWrapper, cortexPubSub);

if(typeof window !== "undefined" && window !== null) {
  window.Cortex = Cortex;
}

module.exports = Cortex;
