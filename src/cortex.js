module.exports = (function() {
  var _cortexPubSub = require("./pubsub"),
      DataWrapper = require("./data_wrapper")(_cortexPubSub);

  class Cortex extends DataWrapper {
    constructor(value, callback) {
      this.__value = value;
      this.__path = [];
      this.__updates = [];
      this.__callbacks = callback ? [callback] : [];
      this.__loopProcessing = false;
      this.__subscribe();
      this.__wrap();
    }

    on(eventName, callback) {
      if(eventName === "update") {
        this.__callbacks.push(callback);
      }
    }

    off(eventName, callback) {
      if(eventName === "update") {
        if(callback) {
          for(var i = 0, ii = this.__callbacks.length; i < ii; i++) {
            if(callback === this.__callbacks[i]) {
              this.__callbacks.splice(i, 1);
              break;
            }
          }
        } else {
          this.__callbacks = [];
        }
      }
    }

    update(newValue, path, forceUpdate) {
      if(!forceUpdate && !this.__shouldUpdate(newValue, path)) {
        return false;
      }

      this.__updates.push({newValue: newValue, path: path});

      // Schedule value setting, rewrapping, and running callbacks in batch so that multiple updates
      // in same event loop only result in a single rewrap and callbacks run.
      if(!this.__loopProcessing) {
        this.__loopProcessing = true;
        setTimeout((this.__batchAll).bind(this), 0);
      }

      return true;
    }

    __batchAll() {
      this.__batchSetValue();
      this.__wrap();

      // Set processing to false so that update from inside a cortex callback
      // takes place in the next event loop.
      this.__loopProcessing = false;
      this.__runCallbacks();
    }

    __batchSetValue() {
      for(var currentUpdate of this.__updates) {
        this.__setValue(currentUpdate.newValue, currentUpdate.path);
      }

      this.__updates = [];
    }

    __runCallbacks() {
      for(var callback of this.__callbacks) {
        if (callback)
          callback(this);
      }
    };

    __subscribe() {
      this.__eventId = _cortexPubSub.subscribeToCortex((function(topic, data) {
        this.update(data.value, data.path, data.forceUpdate);
      }).bind(this), (function(topic, data) {
        this.__remove(data.path);
      }).bind(this));
    }

    __remove(path) {
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
    }

    __setValue(newValue, path) {
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
    }

    __subValue(path) {
      var subValue = this.__value;
      for(var i = 0, ii = path.length; i < ii; i++) {
        subValue = subValue[path[i]];
      }
      return subValue;
    }

    // Check whether newValue is different, if not then return false to bypass rewrap and running callback.
    // Note that we cannot compare stringified values of old and new data because order of keys cannot be guaranteed.
    __shouldUpdate(newValue, path) {
      var oldValue = this.__value;
      for(var i = 0, ii = path.length; i < ii; i++) {
        oldValue = oldValue[path[i]];
      }
      return this.__isDifferent(oldValue, newValue);
    }

    // Recursively performs comparison b/w old and new data
    __isDifferent(oldValue, newValue) {
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
        for(var i = 0, ii = oldValue.length;i < ii; i++) {
          if(this.__isDifferent(oldValue[i], newValue[i])) {
            return true;
          }
        }
      } else {
        return oldValue !== newValue;
      }
    }
  }

  if(typeof window !== "undefined" && window !== null) {
    window.Cortex = Cortex;
  }

  return Cortex;
})();
