module.exports = function(cortexPubSub) {
  var deepDiff = require("deep-diff").diff;

  class DataWrapper {
    constructor(data) {
      this.__eventId = data.eventId;
      this.__value = data.value;
      this.__path = data.path || [];
      this.__changes = data.changes || [];

      this.__wrap();

      this.val = this.getValue;
    }

    set(value, data) {
      var payload = data || {};
      payload["value"] = value;
      payload["path"] = this.__path;
      cortexPubSub.publish("update" + this.__eventId, payload);
    }

    getValue() {
      return this.__value;
    }

    getPath() {
      return this.__path;
    }

    getKey() {
      return this.__path[this.__path.length - 1];
    }

    getChanges() {
      return this.__changes;
    }

    didChange(key) {
      if(!key) {
        return this.__changes.length > 0;
      }

      for (var change of this.__changes) {
        if(change.path[0] === key || this.__hasChange(change, key)) {
          return true;
        }
      }
      return false;
    }

    forEach(callback) {
      if(this.__isObject()) {
        for(var key in this.__wrappers) {
          callback(key, this.__wrappers[key], this.__wrappers);
        }
      } else if(this.__isArray()) {
        this.__wrappers.forEach(callback);
      }
    }

    remove() {
      cortexPubSub.publish("remove" + this.__eventId, {path: this.__path});
    }

    __subValue(path) {
      var subValue = this.__value;
      for(var i = 0, ii = path.length; i < ii; i++) {
        subValue = subValue[path[i]];
      }
      return subValue;
    }

    // Recursively wrap data if @value is a hash or an array.
    // Otherwise there's no need to further wrap primitive or other class instances
    __wrap() {
      this.__cleanup();

      if(this.__isObject()) {
        this.__wrappers = {};
        for(var key in this.__value) {
          this.__wrapChild(key);
        }
      } else if (this.__isArray()) {
        this.__wrappers = [];
        for(var index = 0, length = this.__value.length; index < length; index++) {
          this.__wrapChild(index);
        }
      }
    }

    __wrapChild(key) {
      var path = this.__path.slice();
      path.push(key);
      this.__wrappers[key] = new DataWrapper({
        value: this.__value[key],
        path: path,
        eventId: this.__eventId,
        changes: this.__childChanges(key)
      });
      this[key] = this.__wrappers[key];
    }

    __childChanges(key) {
      var childChanges = [];
      for (var change of this.__changes) {
        if(change.path[0] === key) {
          childChanges.push({
            type: change.type,
            path: change.path.slice(1, change.path.length),
            oldValue: change.oldValue,
            newValue: change.newValue
          });
          break;
        } else if(this.__hasChange(change, key)) {
          childChanges.push({
            type: change.type,
            path: [],
            oldValue: change.oldValue ? change.oldValue[key] : undefined,
            newValue: change.newValue ? change.newValue[key] : undefined
          });
          break;
        }
      }

      return childChanges;
    }

    __hasChange(change, key) {
      return change.path.length === 0 && ((change.oldValue && change.oldValue[key]) || (change.newValue && change.newValue[key]));
    }

    __cleanup() {
      if(this.__wrappers) {
        if(this.__isObject()) {
          for(var key in this.__wrappers) {
            delete this[key];
          }
        } else if(this.__isArray()) {
          for(var i = 0,ii = this.__wrappers.length; i<ii; i++) {
            delete this[i];
          }
        }
        delete this.__wrappers;
      }
    }

    __isObject() {
      return this.__value && this.__value.constructor === Object;
    }

    __isArray() {
      return this.__value && this.__value.constructor === Array;
    }

    __diff(oldValue, newValue) {
      return deepDiff(oldValue, newValue);
    }

    // source: http://stackoverflow.com/a/728694
    __clone(obj) {
      var copy;

      // Handle the 3 simple types, and null or undefined
      if (null == obj || "object" != typeof obj) return obj;

      // Handle Date
      if (obj instanceof Date) {
          copy = new Date();
          copy.setTime(obj.getTime());
          return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
          copy = [];
          for (var i = 0, len = obj.length; i < len; i++) {
              copy[i] = this.__clone(obj[i]);
          }
          return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
          copy = {};
          for (var attr in obj) {
              if (obj.hasOwnProperty(attr)) copy[attr] = this.__clone(obj[attr]);
          }
          return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    }
  }

  // Mixin Array and Hash behaviors
  var ArrayWrapper = require("./wrappers/array"),
      HashWrapper = require("./wrappers/hash");

  var __include = function(klass, mixins) {
    for (var mixin of mixins) {
      for(var methodName in mixin) {
        klass.prototype[methodName] = mixin[methodName];
      }
    }
  };

  __include(DataWrapper, [ArrayWrapper, HashWrapper]);

  return DataWrapper;
};
