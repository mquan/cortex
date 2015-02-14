(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = (function () {
  var _cortexPubSub = require("./pubsub"),
      DataWrapper = require("./data_wrapper")(_cortexPubSub);

  var Cortex = (function (DataWrapper) {
    function Cortex(value, callback) {
      _classCallCheck(this, Cortex);

      this.__value = value;
      this.__path = [];
      this.__updates = [];
      this.__callbacks = callback ? [callback] : [];
      this.__loopProcessing = false;
      this.__subscribe();
      this.__wrap();
    }

    _inherits(Cortex, DataWrapper);

    _prototypeProperties(Cortex, null, {
      on: {
        value: function on(eventName, callback) {
          if (eventName === "update") {
            this.__callbacks.push(callback);
          }
        },
        writable: true,
        configurable: true
      },
      off: {
        value: function off(eventName, callback) {
          if (eventName === "update") {
            if (callback) {
              for (var i = 0, ii = this.__callbacks.length; i < ii; i++) {
                if (callback === this.__callbacks[i]) {
                  this.__callbacks.splice(i, 1);
                  break;
                }
              }
            } else {
              this.__callbacks = [];
            }
          }
        },
        writable: true,
        configurable: true
      },
      update: {
        value: function update(newValue, path, forceUpdate) {
          if (!forceUpdate && !this.__shouldUpdate(newValue, path)) {
            return false;
          }

          this.__updates.push({ newValue: newValue, path: path });

          // Schedule value setting, rewrapping, and running callbacks in batch so that multiple updates
          // in same event loop only result in a single rewrap and callbacks run.
          if (!this.__loopProcessing) {
            this.__loopProcessing = true;
            setTimeout(this.__batchAll.bind(this), 0);
          }

          return true;
        },
        writable: true,
        configurable: true
      },
      __batchAll: {
        value: function __batchAll() {
          this.__batchSetValue();
          this.__wrap();

          // Set processing to false so that update from inside a cortex callback
          // takes place in the next event loop.
          this.__loopProcessing = false;
          this.__runCallbacks();
        },
        writable: true,
        configurable: true
      },
      __batchSetValue: {
        value: function __batchSetValue() {
          for (var _iterator = this.__updates[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var currentUpdate = _step.value;
            this.__setValue(currentUpdate.newValue, currentUpdate.path);
          }

          this.__updates = [];
        },
        writable: true,
        configurable: true
      },
      __runCallbacks: {
        value: function __runCallbacks() {
          for (var _iterator = this.__callbacks[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var callback = _step.value;
            if (callback) callback(this);
          }
        },
        writable: true,
        configurable: true
      },
      __subscribe: {
        value: function __subscribe() {
          this.__eventId = _cortexPubSub.subscribeToCortex((function (topic, data) {
            this.update(data.value, data.path, data.forceUpdate);
          }).bind(this), (function (topic, data) {
            this.__remove(data.path);
          }).bind(this));
        },
        writable: true,
        configurable: true
      },
      __remove: {
        value: function __remove(path) {
          if (path.length) {
            var subPath = path.slice(0, path.length - 1),
                subValue = this.__subValue(subPath),
                key = path[path.length - 1],
                removed = subValue[key];
            if (subValue.constructor === Object) {
              delete subValue[key];
            } else if (subValue.constructor === Array) {
              subValue.splice(key, 1);
            }
            this.update(subValue, subPath, true);
            return removed;
          } else {
            delete this.__wrappers;
            delete this.__value;
          }
        },
        writable: true,
        configurable: true
      },
      __setValue: {
        value: function __setValue(newValue, path) {
          /*
            When saving an object to a variable it's pass by reference, but when doing so for a primitive value
            it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
            than 2 (meaning it can't never be a primitive). When path length is 0 or 1 we set the value directly.
          */
          if (path.length > 1) {
            var subValue = this.__subValue(path.slice(0, path.length - 1));
            subValue[path[path.length - 1]] = newValue;
          } else if (path.length === 1) {
            this.__value[path[0]] = newValue;
          } else {
            this.__value = newValue;
          }
        },
        writable: true,
        configurable: true
      },
      __subValue: {
        value: function __subValue(path) {
          var subValue = this.__value;
          for (var i = 0, ii = path.length; i < ii; i++) {
            subValue = subValue[path[i]];
          }
          return subValue;
        },
        writable: true,
        configurable: true
      },
      __shouldUpdate: {

        // Check whether newValue is different, if not then return false to bypass rewrap and running callback.
        // Note that we cannot compare stringified values of old and new data because order of keys cannot be guaranteed.
        value: function __shouldUpdate(newValue, path) {
          var oldValue = this.__value;
          for (var i = 0, ii = path.length; i < ii; i++) {
            oldValue = oldValue[path[i]];
          }
          return this.__isDifferent(oldValue, newValue);
        },
        writable: true,
        configurable: true
      },
      __isDifferent: {

        // Recursively performs comparison b/w old and new data
        value: function __isDifferent(oldValue, newValue) {
          if (oldValue && oldValue.constructor === Object) {
            if (!newValue || newValue.constructor !== Object || this.__isDifferent(Object.keys(oldValue).sort(), Object.keys(newValue).sort())) {
              return true;
            }
            for (var key in oldValue) {
              if (this.__isDifferent(oldValue[key], newValue[key])) {
                return true;
              }
            }
          } else if (oldValue && oldValue.constructor === Array) {
            if (!newValue || newValue.constructor !== Array || oldValue.length !== newValue.length) {
              return true;
            }
            for (var i = 0, ii = oldValue.length; i < ii; i++) {
              if (this.__isDifferent(oldValue[i], newValue[i])) {
                return true;
              }
            }
          } else {
            return oldValue !== newValue;
          }
        },
        writable: true,
        configurable: true
      }
    });

    return Cortex;
  })(DataWrapper);

  if (typeof window !== "undefined" && window !== null) {
    window.Cortex = Cortex;
  }

  return Cortex;
})();

},{"./data_wrapper":2,"./pubsub":3}],2:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = function (_cortexPubSub) {
  var DataWrapper = (function () {
    function DataWrapper(value, path, eventId) {
      _classCallCheck(this, DataWrapper);

      this.__eventId = eventId;
      this.__value = value;
      this.__path = path || [];
      this.__wrap();

      this.val = this.getValue;
    }

    _prototypeProperties(DataWrapper, null, {
      set: {
        value: function set(value, forceUpdate) {
          _cortexPubSub.publish("update" + this.__eventId, { value: value, path: this.__path, forceUpdate: forceUpdate });
        },
        writable: true,
        configurable: true
      },
      getValue: {
        value: function getValue() {
          return this.__value;
        },
        writable: true,
        configurable: true
      },
      getPath: {
        value: function getPath() {
          return this.__path;
        },
        writable: true,
        configurable: true
      },
      getKey: {
        value: function getKey() {
          return this.__path[this.__path.length - 1];
        },
        writable: true,
        configurable: true
      },
      forEach: {
        value: function forEach(callback) {
          if (this.__isObject()) {
            for (var key in this.__wrappers) {
              callback(key, this.__wrappers[key], this.__wrappers);
            }
          } else if (this.__isArray()) {
            this.__wrappers.forEach(callback);
          }
        },
        writable: true,
        configurable: true
      },
      remove: {
        value: function remove() {
          _cortexPubSub.publish("remove" + this.__eventId, { path: this.__path });
        },
        writable: true,
        configurable: true
      },
      __wrap: {

        // Recursively wrap data if @value is a hash or an array.
        // Otherwise there's no need to further wrap primitive or other class instances
        value: function __wrap() {
          var path;
          this.__cleanup();

          if (this.__isObject()) {
            this.__wrappers = {};
            for (var key in this.__value) {
              path = this.__path.slice();
              path.push(key);
              this.__wrappers[key] = new DataWrapper(this.__value[key], path, this.__eventId);
              this[key] = this.__wrappers[key];
            }
          } else if (this.__isArray()) {
            this.__wrappers = [];
            for (var index = 0, ii = this.__value.length; index < ii; index++) {
              path = this.__path.slice();
              path.push(index);
              this.__wrappers[index] = new DataWrapper(this.__value[index], path, this.__eventId);
              this[index] = this.__wrappers[index];
            }
          }
        },
        writable: true,
        configurable: true
      },
      __cleanup: {
        value: function __cleanup() {
          if (this.__wrappers) {
            if (this.__isObject()) {
              for (var key in this.__wrappers) {
                delete this[key];
              }
            } else if (this.__isArray()) {
              for (var i = 0, ii = this.__wrappers.length; i < ii; i++) {
                delete this[i];
              }
            }
            delete this.__wrappers;
          }
        },
        writable: true,
        configurable: true
      },
      __forceUpdate: {
        value: function __forceUpdate() {
          this.set(this.__value, true);
        },
        writable: true,
        configurable: true
      },
      __isObject: {
        value: function __isObject() {
          return this.__value && this.__value.constructor === Object;
        },
        writable: true,
        configurable: true
      },
      __isArray: {
        value: function __isArray() {
          return this.__value && this.__value.constructor === Array;
        },
        writable: true,
        configurable: true
      }
    });

    return DataWrapper;
  })();

  // Mixin Array and Hash behaviors
  var ArrayWrapper = require("./wrappers/array"),
      HashWrapper = require("./wrappers/hash");
  var __include = function (klass, mixins) {
    for (var _iterator = mixins[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      var mixin = _step.value;
      for (var methodName in mixin) {
        klass.prototype[methodName] = mixin[methodName];
      }
    }
  };

  __include(DataWrapper, [ArrayWrapper, HashWrapper]);

  return DataWrapper;
};

},{"./wrappers/array":4,"./wrappers/hash":5}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = (function () {
  var PubSub = (function () {
    function PubSub() {
      _classCallCheck(this, PubSub);

      this.uid = -1;
      this.topics = {};
    }

    _prototypeProperties(PubSub, null, {
      subscribe: {
        value: function subscribe(topic, callback) {
          if (!this.topics.hasOwnProperty(topic)) {
            this.topics[topic] = [];
          }
          this.topics[topic].push({ callback: callback });
        },
        writable: true,
        configurable: true
      },
      publish: {
        value: function publish(topic, data) {
          if (!this.topics.hasOwnProperty(topic)) {
            return false;
          }

          var subscribers = this.topics[topic];
          var notify = function () {
            for (var i = 0, ii = subscribers.length; i < ii; i++) {
              subscribers[i].callback(topic, data);
            }
          };

          notify();

          return true;
        },
        writable: true,
        configurable: true
      },
      subscribeToCortex: {
        value: function subscribeToCortex(updateCallback, removeCallback) {
          this.uid += 1;
          this.subscribe("update" + this.uid, updateCallback);
          this.subscribe("remove" + this.uid, removeCallback);
          return this.uid;
        },
        writable: true,
        configurable: true
      },
      unsubscribeFromCortex: {
        value: function unsubscribeFromCortex(topicId) {
          delete this.topics["update" + topicId];
          delete this.topics["remove" + topicId];
        },
        writable: true,
        configurable: true
      }
    });

    return PubSub;
  })();

  return new PubSub();
})();

},{}],4:[function(require,module,exports){
"use strict";

var ArrayWrapper = {
  count: function () {
    return this.__value.length;
  },

  map: function (callback) {
    return this.__wrappers.map(callback);
  },

  filter: function (callback, thisArg) {
    return this.__wrappers.filter(callback, thisArg);
  },

  find: function (callback) {
    for (var index = 0, length = this.__wrappers.length; index < length; index++) {
      if (callback(this.__wrappers[index], index, this.__wrappers)) {
        return this.__wrappers[index];
      }
    }
    return null;
  },

  findIndex: function (callback) {
    for (var index = 0, length = this.__wrappers.length; index < length; index++) {
      if (callback(this.__wrappers[index], index, this.__wrappers)) {
        return index;
      }
    }
    return -1;
  },

  push: function (value) {
    var length = this.__value.push(value);
    this.__forceUpdate();
    return length;
  },

  pop: function () {
    var last = this.__value.pop();
    this.__forceUpdate();
    return last;
  },

  unshift: function (value) {
    var length = this.__value.unshift(value);
    this.__forceUpdate();
    return length;
  },

  shift: function () {
    var last = this.__value.shift();
    this.__forceUpdate();
    return last;
  },

  insertAt: function (index, value) {
    var args = [index, 0].concat(value);
    Array.prototype.splice.apply(this.__value, args);
    this.__forceUpdate();
  },

  removeAt: function (index, howMany) {
    if (isNaN(howMany) || howMany <= 0) {
      howMany = 1;
    }
    var removed = this.__value.splice(index, howMany);
    this.__forceUpdate();
    return removed;
  }
};

module.exports = ArrayWrapper;

},{}],5:[function(require,module,exports){
"use strict";

var HashWrapper = {
  keys: function () {
    return Object.keys(this.__value);
  },

  values: function () {
    var key,
        values = [];
    for (key in this.__value) {
      values.push(this.__value[key]);
    }
    return values;
  },

  hasKey: function (key) {
    return this.__value[key] != null;
  },

  destroy: function (key) {
    var removed = this.__value[key];
    delete this.__value[key];
    this.__forceUpdate();
    return removed;
  },

  "delete": function (key) {
    console.warn("Method deprecated! Please use .destroy(key) method");
    return this.remove(key);
  },

  add: function (key, value) {
    this.__value[key] = value;
    this.__forceUpdate();
    return value;
  }
};

module.exports = HashWrapper;

},{}]},{},[1]);
