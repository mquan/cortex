module.exports = function(_cortexPubSub) {
  class DataWrapper {
    constructor(value, path, eventId) {
      this.__eventId = eventId;
      this.__value = value;
      this.__path = path || [];
      this.__wrap();

      this.val = this.getValue;
    }

    set(value, forceUpdate) {
      _cortexPubSub.publish("update" + this.__eventId, {value: value, path: this.__path, forceUpdate: forceUpdate});
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
      _cortexPubSub.publish("remove" + this.__eventId, {path: this.__path});
    }

    // Recursively wrap data if @value is a hash or an array.
    // Otherwise there's no need to further wrap primitive or other class instances
    __wrap() {
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

    __forceUpdate() {
      this.set(this.__value, true);
    }

    __isObject() {
      return this.__value && this.__value.constructor === Object;
    }

    __isArray() {
      return this.__value && this.__value.constructor === Array;
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
