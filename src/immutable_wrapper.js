module.exports = function(cortexPubSub) {
  var deepDiff = require("deep-diff").diff;
  let changeMappings = {"N": 'add', "E": 'update', "A": 'add', "D": 'delete'};

  class ImmutableWrapper {
    constructor(data) {
      if (data) {
        this.__eventId = data.eventId;
        this.__value = data.value;
        this.__path = data.path || [];
      }

      this.__wrap();

      this.val = this.getValue;
    }

    static deepDiff(oldValue, newValue) {
      return deepDiff(oldValue, newValue);
    }

    static __isObject(obj) {
      return obj && obj.constructor === Object;
    }

    static __isArray(arr) {
      return arr && arr.constructor === Array;
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

    set(value) {
      var rawDiffs = this.constructor.deepDiff(this.__value, value);
      if (rawDiffs) {
        var diffs = [], diff, path;

        for(var i = 0, ii = rawDiffs.length; i < ii; i++) {
          path = this.__path.slice();
          diff = rawDiffs[i];

          // Diff path may not be present if value is shallow
          if(diff.path)
            path = path.concat(diff.path);

          // Both index and path may be available
          if(typeof diff.index !== 'undefined')
            path.push(diff.index);

          diffs.push({
            action: changeMappings[diff.item ? diff.item.kind : diff.kind],
            path: path,
            value: diff.item ? diff.item.rhs : diff.rhs
          });
        }

        this.__notifyUpdate(diffs);
      }
    }

    forEach(callback) {
      if(this.constructor.__isObject(this.__wrappers)) {
        for(var key in this.__wrappers) {
          callback(key, this.__wrappers[key], this.__wrappers);
        }
      } else if (this.constructor.__isArray(this.__wrappers)) {
        this.__wrappers.forEach(callback);
      }
    }

    destroy() {
      let diffs = [{
        action: 'delete',
        path: this.__path.slice()
      }];

      this.__notifyUpdate(diffs);
    }

    __forceUpdate(action, key, value) {
      let diffs = [{
        action: action,
        path: this.__path.concat(key),
        value: value,
        force: true
      }];

      this.__notifyUpdate(diffs);
    }

    __notifyUpdate(diffs) {
      if (diffs && diffs.length) {
        cortexPubSub.publish("update" + this.__eventId, diffs);
      }
    }

    __setEventId(eventId) {
      this.__eventId = eventId;
      for (var key in this.__wrappers) {
        this.__wrappers[key].__setEventId(eventId);
      }
    }

    __wrap() {
      if(this.constructor.__isObject(this.__value)) {
        this.__wrappers = {};
        for(var key in this.__value) {
          this.__wrapChild(key);
        }
      } else if (this.constructor.__isArray(this.__value)) {
        this.__wrappers = [];
        for(var index = 0, length = this.__value.length; index < length; index++) {
          this.__wrapChild(index);
        }
      }
    }

    __wrapChild(key) {
      var path = this.__path.slice();
      path.push(key);
      this.__wrappers[key] = new ImmutableWrapper({
        value: this.__value[key],
        path: path,
        eventId: this.__eventId
      });
      this[key] = this.__wrappers[key];
    }
  }

  let ArrayWrapper = require("./wrappers/array_wrapper");
  let ObjectWrapper = require("./wrappers/object_wrapper");

  var __include = function(klass, mixins) {
    for(var i = 0, ii = mixins.length; i < ii; i++) {
      for(var methodName in mixins[i]) {
        klass.prototype[methodName] = mixins[i][methodName];
      }
    }
  };

  __include(ImmutableWrapper, [ArrayWrapper, ObjectWrapper]);

  return ImmutableWrapper;
};