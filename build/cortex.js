(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = (function () {
  var cortexPubSub = require("./pubsub"),
      DataWrapper = require("./data_wrapper")(cortexPubSub),
      changeMappings = { N: "new", E: "update", A: "update", D: "delete" };

  var Cortex = (function (DataWrapper) {
    function Cortex(value, callback) {
      _classCallCheck(this, Cortex);

      this.__value = value;
      this.__path = [];
      this.__updates = [];
      this.__callbacks = callback ? [callback] : [];
      this.__loopProcessing = false;
      this.__subscribe();

      // Set initial changes to empty because we don't want any component rerendering to misinterpret available changes.
      // For instance, if a new cortex initialization is considered a change from undefined to its current value then a setState call
      // would trigger shouldComponentUpdate, which would return the changes even though no cortex update actually happens.
      // The changes would incorrectly persist until an actual cortex rewrap occurs.
      this.__changes = [];
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
        value: function update(data) {
          if (this.__checkUpdate(data.oldValue, data.value, data.path)) {
            // Schedule value setting, rewrapping, and running callbacks in batch so that multiple updates
            // in the same event loop only result in a single rewrap and callbacks run.
            if (!this.__loopProcessing) {
              this.__loopProcessing = true;

              setTimeout(this.__batchAll.bind(this), 0);
            }

            return true;
          } else {
            return false;
          }
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
          this.__eventId = cortexPubSub.subscribeToCortex((function (topic, data) {
            this.update(data);
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
                removed = subValue[key],
                oldValue = this.__clone(subValue);

            if (subValue.constructor === Object) {
              delete subValue[key];
            } else if (subValue.constructor === Array) {
              subValue.splice(key, 1);
            }
            this.update({ value: subValue, path: subPath, oldValue: oldValue });
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
      __checkUpdate: {

        // Check whether newValue is different, if not then return false to bypass rewrap and running callbacks.
        // Note that we cannot compare stringified values of old and new data because order of keys cannot be guaranteed.
        value: function __checkUpdate(oldValue, newValue, path) {
          var diffs;

          if (oldValue) {
            diffs = this.__diff(oldValue, newValue);
            this.__computeChanges(diffs, path);
            return true;
          } else {
            var oldValue = this.__subValue(path);
            diffs = this.__diff(oldValue, newValue);

            if (diffs) {
              // Add to queue to update in batch later.
              this.__updates.push({ newValue: newValue, path: path });

              this.__computeChanges(diffs, path);
              return true;
            } else {
              return false;
            }
          }
        },
        writable: true,
        configurable: true
      },
      __computeChanges: {

        // changes = [{kind: ('new' || 'update' || 'delete'), path: [...], oldValue: ..., newValue: ...}]
        value: function __computeChanges(diffs, path) {
          var changeType, diffPath;

          // Reset changes at beginning of event loop. This has to be done after new changes are detected because
          // we don't want to override previous changes if current update does not result in any new change.
          if (!this.__loopProcessing) {
            this.__changes = [];
          }

          for (var _iterator = diffs[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var diff = _step.value;
            // Raw deep diff sample: {"kind":"A","path":[1,"b"],"index":1,"item":{"kind":"N","rhs":1}}
            // Use the change type closest to the change.
            changeType = changeMappings[diff.item ? diff.item.kind : diff.kind];

            diffPath = path;

            if (diff.path) {
              diffPath = diffPath.concat(diff.path);
            }

            if (diff.index) {
              diffPath.push(diff.index);
            }

            this.__changes.push({
              type: changeType,
              path: diffPath,
              oldValue: diff.item ? diff.item.lhs : diff.lhs,
              newValue: diff.item ? diff.item.rhs : diff.rhs
            });
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

},{"./data_wrapper":3,"./pubsub":4}],2:[function(require,module,exports){
(function (global){
/*!
 * deep-diff.
 * Licensed under the MIT License.
 */ 
/*jshint indent:2, laxcomma:true*/
;(function (undefined) {
  "use strict";

  var $scope
  , conflict, conflictResolution = [];
  if (typeof global === 'object' && global) {
    $scope = global;
  } else if (typeof window !== 'undefined') {
    $scope = window;
  } else {
    $scope = {};
  }
  conflict = $scope.DeepDiff;
  if (conflict) {
    conflictResolution.push(
      function () {
        if ('undefined' !== typeof conflict && $scope.DeepDiff === accumulateDiff) {
          $scope.DeepDiff = conflict;
          conflict = undefined;
        }
      });
  }

  // nodejs compatible on server side and in the browser.
  function inherits(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  }

  function Diff(kind, path) {
    Object.defineProperty(this, 'kind', { value: kind, enumerable: true });
    if (path && path.length) {
      Object.defineProperty(this, 'path', { value: path, enumerable: true });
    }
  }

  function DiffEdit(path, origin, value) {
    DiffEdit.super_.call(this, 'E', path);
    Object.defineProperty(this, 'lhs', { value: origin, enumerable: true });
    Object.defineProperty(this, 'rhs', { value: value, enumerable: true });
  }
  inherits(DiffEdit, Diff);

  function DiffNew(path, value) {
    DiffNew.super_.call(this, 'N', path);
    Object.defineProperty(this, 'rhs', { value: value, enumerable: true });
  }
  inherits(DiffNew, Diff);

  function DiffDeleted(path, value) {
    DiffDeleted.super_.call(this, 'D', path);
    Object.defineProperty(this, 'lhs', { value: value, enumerable: true });
  }
  inherits(DiffDeleted, Diff);

  function DiffArray(path, index, item) {
    DiffArray.super_.call(this, 'A', path);
    Object.defineProperty(this, 'index', { value: index, enumerable: true });
    Object.defineProperty(this, 'item', { value: item, enumerable: true });
  }
  inherits(DiffArray, Diff);

  function arrayRemove(arr, from, to) {
    var rest = arr.slice((to || from) + 1 || arr.length);
    arr.length = from < 0 ? arr.length + from : from;
    arr.push.apply(arr, rest);
    return arr;
  }

  function deepDiff(lhs, rhs, changes, prefilter, path, key, stack) {
    path = path || [];
    var currentPath = path.slice(0);
    if (typeof key !== 'undefined') {
      if (prefilter && prefilter(currentPath, key)) { return; }
      currentPath.push(key);
    }
    var ltype = typeof lhs;
    var rtype = typeof rhs;
    if (ltype === 'undefined') {
      if (rtype !== 'undefined') {
        changes(new DiffNew(currentPath, rhs));
      }
    } else if (rtype === 'undefined') {
      changes(new DiffDeleted(currentPath, lhs));
    } else if (ltype !== rtype) {
      changes(new DiffEdit(currentPath, lhs, rhs));
    } else if (lhs instanceof Date && rhs instanceof Date && ((lhs - rhs) !== 0)) {
      changes(new DiffEdit(currentPath, lhs, rhs));
    } else if (ltype === 'object' && lhs !== null && rhs !== null) {
      stack = stack || [];
      if (stack.indexOf(lhs) < 0) {
        stack.push(lhs);
        if (Array.isArray(lhs)) {
          var i
          , len = lhs.length
          ;
          for (i = 0; i < lhs.length; i++) {
            if (i >= rhs.length) {
              changes(new DiffArray(currentPath, i, new DiffDeleted(undefined, lhs[i])));
            } else {
              deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack);
            }
          }
          while (i < rhs.length) {
            changes(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i++])));
          }
        } else {
          var akeys = Object.keys(lhs);
          var pkeys = Object.keys(rhs);
          akeys.forEach(function (k, i) {
            var other = pkeys.indexOf(k);
            if (other >= 0) {
              deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack);
              pkeys = arrayRemove(pkeys, other);
            } else {
              deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack);
            }
          });
          pkeys.forEach(function (k) {
            deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack);
          });
        }
        stack.length = stack.length - 1;
      }
    } else if (lhs !== rhs) {
      if (!(ltype === "number" && isNaN(lhs) && isNaN(rhs))) {
        changes(new DiffEdit(currentPath, lhs, rhs));
      }
    }
  }

  function accumulateDiff(lhs, rhs, prefilter, accum) {
    accum = accum || [];
    deepDiff(lhs, rhs,
      function (diff) {
        if (diff) {
          accum.push(diff);
        }
      },
      prefilter);
    return (accum.length) ? accum : undefined;
  }

  function applyArrayChange(arr, index, change) {
    if (change.path && change.path.length) {
      var it = arr[index], i, u = change.path.length - 1;
      for (i = 0; i < u; i++) {
        it = it[change.path[i]];
      }
      switch (change.kind) {
        case 'A':
        applyArrayChange(it[change.path[i]], change.index, change.item);
        break;
        case 'D':
        delete it[change.path[i]];
        break;
        case 'E':
        case 'N':
        it[change.path[i]] = change.rhs;
        break;
      }
    } else {
      switch(change.kind) {
        case 'A':
        applyArrayChange(arr[index], change.index, change.item);
        break;
        case 'D':
        arr = arrayRemove(arr, index);
        break;
        case 'E':
        case 'N':
        arr[index] = change.rhs;
        break;
      }
    }
    return arr;
  }

  function applyChange(target, source, change) {
    if (target && source && change && change.kind) {
      var it = target
      , i = -1
      , last = change.path.length - 1
      ;
      while (++i < last) {
        if (typeof it[change.path[i]] === 'undefined') {
          it[change.path[i]] = (typeof change.path[i] === 'number') ? new Array() : {};
        }
        it = it[change.path[i]];
      }
      switch(change.kind) {
        case 'A':
        applyArrayChange(it[change.path[i]], change.index, change.item);
        break;
        case 'D':
        delete it[change.path[i]];
        break;
        case 'E':
        case 'N':
        it[change.path[i]] = change.rhs;
        break;
      }
    }
  }

  function revertArrayChange(arr, index, change) {
    if (change.path && change.path.length) {
      // the structure of the object at the index has changed...
      var it = arr[index], i, u = change.path.length - 1;
      for (i = 0; i < u; i++) {
        it = it[change.path[i]];
      }
      switch(change.kind) {
        case 'A':
        revertArrayChange(it[change.path[i]], change.index, change.item);
        break;
        case 'D':
        it[change.path[i]] = change.lhs;
        break;
        case 'E':
        it[change.path[i]] = change.lhs;
        break;
        case 'N':
        delete it[change.path[i]];
        break;
      }
    } else {
      // the array item is different...
      switch(change.kind) {
        case 'A':
        revertArrayChange(arr[index], change.index, change.item);
        break;
        case 'D':
        arr[index] = change.lhs;
        break;
        case 'E':
        arr[index] = change.lhs;
        break;
        case 'N':
        arr = arrayRemove(arr, index);
        break;
      }
    }
    return arr;
  }

  function revertChange(target, source, change) {
    if (target && source && change && change.kind) {
      var it = target, i, u;
      u = change.path.length - 1;
      for (i = 0; i < u; i++) {
        if (typeof it[change.path[i]] === 'undefined') {
          it[change.path[i]] = {};
        }
        it = it[change.path[i]];
      }
      switch (change.kind) {
        case 'A':
          // Array was modified...
          // it will be an array...
          revertArrayChange(it[change.path[i]], change.index, change.item);
          break;
        case 'D':
          // Item was deleted...
          it[change.path[i]] = change.lhs;
          break;
        case 'E':
          // Item was edited...
          it[change.path[i]] = change.lhs;
          break;
        case 'N':
          // Item is new...
          delete it[change.path[i]];
          break;
      }
    }
  }

  function applyDiff(target, source, filter) {
    if (target && source) {
      var onChange = function (change) {
        if (!filter || filter(target, source, change)) {
          applyChange(target, source, change);
        }
      };
      deepDiff(target, source, onChange);
    }
  }

  Object.defineProperties(accumulateDiff, {

    diff: { value: accumulateDiff, enumerable: true },
    observableDiff: { value: deepDiff, enumerable: true },
    applyDiff: { value: applyDiff, enumerable: true },
    applyChange: { value: applyChange, enumerable: true },
    revertChange: { value: revertChange, enumerable: true },
    isConflict: { value: function () { return 'undefined' !== typeof conflict; }, enumerable: true },
    noConflict: {
      value: function () {
        if (conflictResolution) {
          conflictResolution.forEach(function (it) { it(); });
          conflictResolution = null;
        }
        return accumulateDiff;
      },
      enumerable: true
    }
  });

  if (typeof module !== 'undefined' && module && typeof exports === 'object' && exports && module.exports === exports) {
    module.exports = accumulateDiff; // nodejs
  } else {
    $scope.DeepDiff = accumulateDiff; // other... browser?
  }
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

module.exports = function (cortexPubSub) {
  var deepDiff = require("deep-diff").diff;

  var DataWrapper = (function () {
    function DataWrapper(data) {
      _classCallCheck(this, DataWrapper);

      this.__eventId = data.eventId;
      this.__value = data.value;
      this.__path = data.path || [];
      this.__changes = data.changes || [];

      this.__wrap();

      this.val = this.getValue;
    }

    _prototypeProperties(DataWrapper, null, {
      set: {
        value: function set(value, data) {
          var payload = data || {};
          payload.value = value;
          payload.path = this.__path;
          cortexPubSub.publish("update" + this.__eventId, payload);
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
      getChanges: {
        value: function getChanges() {
          return this.__changes;
        },
        writable: true,
        configurable: true
      },
      didChange: {
        value: function didChange(key) {
          if (!key) {
            return this.__changes.length > 0;
          }

          for (var _iterator = this.__changes[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var change = _step.value;
            if (change.path[0] === key || this.__hasChange(change, key)) {
              return true;
            }
          }
          return false;
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
          cortexPubSub.publish("remove" + this.__eventId, { path: this.__path });
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
      __wrap: {

        // Recursively wrap data if @value is a hash or an array.
        // Otherwise there's no need to further wrap primitive or other class instances
        value: function __wrap() {
          this.__cleanup();

          if (this.__isObject()) {
            this.__wrappers = {};
            for (var key in this.__value) {
              this.__wrapChild(key);
            }
          } else if (this.__isArray()) {
            this.__wrappers = [];
            for (var index = 0, length = this.__value.length; index < length; index++) {
              this.__wrapChild(index);
            }
          }
        },
        writable: true,
        configurable: true
      },
      __wrapChild: {
        value: function __wrapChild(key) {
          var path = this.__path.slice();
          path.push(key);
          this.__wrappers[key] = new DataWrapper({
            value: this.__value[key],
            path: path,
            eventId: this.__eventId,
            changes: this.__childChanges(key)
          });
          this[key] = this.__wrappers[key];
        },
        writable: true,
        configurable: true
      },
      __childChanges: {
        value: function __childChanges(key) {
          var childChanges = [];
          for (var _iterator = this.__changes[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var change = _step.value;
            if (change.path[0] === key) {
              childChanges.push({
                type: change.type,
                path: change.path.slice(1, change.path.length),
                oldValue: change.oldValue,
                newValue: change.newValue
              });
              break;
            } else if (this.__hasChange(change, key)) {
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
        },
        writable: true,
        configurable: true
      },
      __hasChange: {
        value: function __hasChange(change, key) {
          return change.path.length === 0 && (change.oldValue && change.oldValue[key] || change.newValue && change.newValue[key]);
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
      },
      __diff: {
        value: function __diff(oldValue, newValue) {
          return deepDiff(oldValue, newValue);
        },
        writable: true,
        configurable: true
      },
      __clone: {

        // source: http://stackoverflow.com/a/728694
        value: function __clone(obj) {
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

},{"./wrappers/array":5,"./wrappers/hash":6,"deep-diff":2}],4:[function(require,module,exports){
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

          for (var _iterator = subscribers[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
            var subscriber = _step.value;
            subscriber.callback(topic, data);
          }

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

},{}],5:[function(require,module,exports){
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
    var oldValue = this.__clone(this.__value),
        length = this.__value.push(value);
    this.set(this.__value, { oldValue: oldValue });
    return length;
  },

  pop: function () {
    var oldValue = this.__clone(this.__value),
        last = this.__value.pop();
    this.set(this.__value, { oldValue: oldValue });
    return last;
  },

  unshift: function (value) {
    var oldValue = this.__clone(this.__value),
        length = this.__value.unshift(value);
    this.set(this.__value, { oldValue: oldValue });
    return length;
  },

  shift: function () {
    var oldValue = this.__clone(this.__value),
        last = this.__value.shift();
    this.set(this.__value, { oldValue: oldValue });
    return last;
  },

  insertAt: function (index, value) {
    var oldValue = this.__clone(this.__value),
        args = [index, 0].concat(value);

    Array.prototype.splice.apply(this.__value, args);
    this.set(this.__value, { oldValue: oldValue });
  },

  removeAt: function (index) {
    var howMany = arguments[1] === undefined ? 1 : arguments[1];
    var oldValue = this.__clone(this.__value),
        removed = this.__value.splice(index, howMany);

    this.set(this.__value, { oldValue: oldValue });
    return removed;
  }
};

module.exports = ArrayWrapper;

},{}],6:[function(require,module,exports){
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
    var oldValue = this.__clone(this.__value),
        removed = this.__value[key];
    delete this.__value[key];
    this.set(this.__value, { oldValue: oldValue });
    return removed;
  },

  add: function (key, value) {
    var oldValue = this.__clone(this.__value);
    this.__value[key] = value;
    this.set(this.__value, { oldValue: oldValue });
    return value;
  }
};

module.exports = HashWrapper;

},{}]},{},[1]);
