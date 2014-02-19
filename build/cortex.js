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
    this.eventId = eventId;
    this.value = value;
    this.path = path || [];
    this._wrap();
  }

  DataWrapper.prototype.set = function(value, forceUpdate) {
    _cortexPubSub.publish("update" + this.eventId, {value: value, path: this.path, forceUpdate: forceUpdate});
  };

  DataWrapper.prototype.get = function(key) {
    return this.wrappers[key];
  };

  DataWrapper.prototype.getValue = function() {
    return this.value;
  };

  DataWrapper.prototype.getPath = function() {
    return this.path;
  };

  DataWrapper.prototype.getKey = function() {
    return this.path[this.path.length - 1];
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
    _cortexPubSub.publish("remove" + this.eventId, {path: this.path});
  };

  // Recursively wrap data if @value is a hash or an array.
  // Otherwise there's no need to further wrap primitive or other class instances
  DataWrapper.prototype._wrap = function() {
    delete this.wrappers;
    var path;
    if(this._isObject()) {
      this.wrappers = {};
      for(var key in this.value) {
        path = this.path.slice();
        path.push(key);
        this.wrappers[key] = new DataWrapper(this.value[key], path, this.eventId);
      }
    } else if (this._isArray()) {
      this.wrappers = [];
      for(var i = 0, ii = this.value.length;i < ii; i++) {
        path = this.path.slice();
        path.push(i);
        this.wrappers.push(new DataWrapper(this.value[i], path, this.eventId));
      }
    }
  };

  DataWrapper.prototype._forceUpdate = function() {
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
    this._forceUpdate();
    return length;
  },

  pop: function() {
    var last = this.value.pop();
    this._forceUpdate();
    return last;
  },

  insertAt: function(index, value) {
    var args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.value, args);
    this._forceUpdate();
  },

  removeAt: function(index, howMany) {
    if(howMany == null) {
      howMany = 1;
    }
    var removed = this.value.splice(index, howMany);
    this._forceUpdate();
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
  },

  add: function(key, value) {
    this.value[key] = value;
    this.set(this.value, true);
    return value;
  }
};

module.exports = HashWrapper;

},{}]},{},[2])