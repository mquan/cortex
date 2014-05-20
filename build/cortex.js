(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var __include = function(klass, mixins) {
  for(var i=0,ii=mixins.length;i<ii;i++) {
    for(var methodName in mixins[i]) {
      klass.prototype[methodName] = mixins[i][methodName];
    }
  }
};

module.exports = function(_mixins, _cortexPubSub) {
  function DataWrapper(value, path, eventId) {
    this.__eventId = eventId;
    this.__value = value;
    this.__path = path || [];
    this.__wrap();
  }

  DataWrapper.prototype.set = function(value, forceUpdate) {
    _cortexPubSub.publish("update" + this.__eventId, {value: value, path: this.__path, forceUpdate: forceUpdate});
  };

  DataWrapper.prototype.getValue = function() {
    return this.__value;
  };

  // Short alias for getValue
  DataWrapper.prototype.val = DataWrapper.prototype.getValue;

  DataWrapper.prototype.getPath = function() {
    return this.__path;
  };

  DataWrapper.prototype.getKey = function() {
    return this.__path[this.__path.length - 1];
  };

  DataWrapper.prototype.forEach = function(callback) {
    if(this.__isObject()) {
      for(var key in this.__wrappers) {
        callback(key, this.__wrappers[key], this.__wrappers);
      }
    } else if(this.__isArray()) {
      this.__wrappers.forEach(callback);
    }
  };

  DataWrapper.prototype.remove = function() {
    _cortexPubSub.publish("remove" + this.__eventId, {path: this.__path});
  };

  // Recursively wrap data if @value is a hash or an array.
  // Otherwise there's no need to further wrap primitive or other class instances
  DataWrapper.prototype.__wrap = function() {
    var path;
    this.__cleanup();

    if(this.__isObject()) {
      this.__wrappers = {};
      for(var key in this.__value) {
        path = this.__path.slice();
        path.push(key);
        this.__wrappers[key] = new DataWrapper(this.__value[key], path, this.__eventId);
        this[key] = this.__wrappers[key];
      }
    } else if (this.__isArray()) {
      this.__wrappers = [];
      for(var index = 0, ii = this.__value.length;index < ii; index++) {
        path = this.__path.slice();
        path.push(index);
        this.__wrappers[index] = new DataWrapper(this.__value[index], path, this.__eventId);
        this[index] = this.__wrappers[index];
      }
    }
  };

  DataWrapper.prototype.__cleanup = function() {
    if(this.__wrappers) {
      if(this.__isObject()) {
        for(var key in this.__wrappers) {
          delete this[key];
        }
      } else if(this.__isArray()) {
        for(var i=0,ii=this.__wrappers.length;i<ii;i++) {
          delete this[i];
        }
      }
      delete this.__wrappers;
    }
  };

  DataWrapper.prototype.__forceUpdate = function() {
    this.set(this.__value, true);
  };

  DataWrapper.prototype.__isObject = function() {
    return this.__value && this.__value.constructor === Object;
  };

  DataWrapper.prototype.__isArray = function() {
    return this.__value && this.__value.constructor === Array;
  };

  __include(DataWrapper, _mixins);

  return DataWrapper;
};

},{}],2:[function(require,module,exports){
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
    this.__callbacksQueued = false;
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

    // TODO: Batch rewrap into a single call
    // rewrap starting from highest level subtree(s)
    this.__rewrap(path);

    // Schedule callbacks run in batch so that multiple updates
    // in same run loop only result in a single call to runCallbacks.
    if(!this.__callbacksQueued) {
      this.__callbacksQueued = true;
      setTimeout((function() {
        this.__runCallbacks();
      }).bind(this), 0);
    }

    return true;
  };

  Cortex.prototype.__runCallbacks = function() {
    for(var i=0, ii=this.__callbacks.length;i < ii;i++) {
      if(this.__callbacks[i]) {
        this.__callbacks[i](this);
      }
    }
    this.__callbacksQueued = false;
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

},{"./data_wrapper":1,"./pubsub":3,"./wrappers/array":4,"./wrappers/hash":5}],3:[function(require,module,exports){
var PubSub = (function() {
  function PubSub() {
    this.uid = -1;
    this.topics = {};
  }

  PubSub.prototype.subscribe = function(topic, callback) {
    if(!this.topics.hasOwnProperty(topic)) {
      this.topics[topic] = [];
    }
    this.topics[topic].push({callback: callback});
  };


  PubSub.prototype.publish = function(topic, data) {
    if(!this.topics.hasOwnProperty(topic)) {
      return false;
    }

    var subscribers = this.topics[topic];
    var notify = function() {
      for(var i=0, ii=subscribers.length;i < ii;i++) {
        subscribers[i].callback(topic, data);
      }
    };

    notify();

    return true;
  };

  // Add both update and remove subscriptions with 1 call.
  // Return the unique id so each cortex can handle its own event id.
  PubSub.prototype.subscribeToCortex = function(updateCallback, removeCallback) {
    this.uid += 1;
    this.subscribe("update" + this.uid, updateCallback);
    this.subscribe("remove" + this.uid, removeCallback);
    return this.uid;
  };

  PubSub.prototype.unsubscribeFromCortex = function(topicId) {
    delete this.topics["update" + topicId];
    delete this.topics["remove" + topicId];
  };

  return PubSub;
})();

module.exports = new PubSub();

},{}],4:[function(require,module,exports){
var ArrayWrapper = {
  count: function() {
    return this.__value.length;
  },

  map: function(callback) {
    return this.__wrappers.map(callback);
  },

  filter: function(callback, thisArg) {
    return this.__wrappers.filter(callback, thisArg);
  },

  find: function(callback) {
    for(var index = 0, length = this.__wrappers.length;index < length;index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return this.__wrappers[index];
      }
    }
    return null;
  },

  findIndex: function(callback) {
    for(var index = 0, length = this.__wrappers.length;index < length;index++) {
      if(callback(this.__wrappers[index], index, this.__wrappers)) {
        return index;
      }
    }
    return -1;
  },

  push: function(value) {
    var length = this.__value.push(value);
    this.__forceUpdate();
    return length;
  },

  pop: function() {
    var last = this.__value.pop();
    this.__forceUpdate();
    return last;
  },

  unshift: function(value) {
    var length = this.__value.unshift(value);
    this.__forceUpdate();
    return length;
  },

  shift: function() {
    var last = this.__value.shift();
    this.__forceUpdate();
    return last;
  },

  insertAt: function(index, value) {
    var args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.__value, args);
    this.__forceUpdate();
  },

  removeAt: function(index, howMany) {
    if(isNaN(howMany) || howMany <= 0) {
      howMany = 1;
    }
    var removed = this.__value.splice(index, howMany);
    this.__forceUpdate();
    return removed;
  }
};

module.exports = ArrayWrapper;

},{}],5:[function(require,module,exports){
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

},{}]},{},[2])