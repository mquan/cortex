(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cortex = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.DeepDiff = factory());
}(this, (function () { 'use strict';

var $scope;
var conflict;
var conflictResolution = [];
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
    function() {
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
  Object.defineProperty(this, 'kind', {
    value: kind,
    enumerable: true
  });
  if (path && path.length) {
    Object.defineProperty(this, 'path', {
      value: path,
      enumerable: true
    });
  }
}

function DiffEdit(path, origin, value) {
  DiffEdit.super_.call(this, 'E', path);
  Object.defineProperty(this, 'lhs', {
    value: origin,
    enumerable: true
  });
  Object.defineProperty(this, 'rhs', {
    value: value,
    enumerable: true
  });
}
inherits(DiffEdit, Diff);

function DiffNew(path, value) {
  DiffNew.super_.call(this, 'N', path);
  Object.defineProperty(this, 'rhs', {
    value: value,
    enumerable: true
  });
}
inherits(DiffNew, Diff);

function DiffDeleted(path, value) {
  DiffDeleted.super_.call(this, 'D', path);
  Object.defineProperty(this, 'lhs', {
    value: value,
    enumerable: true
  });
}
inherits(DiffDeleted, Diff);

function DiffArray(path, index, item) {
  DiffArray.super_.call(this, 'A', path);
  Object.defineProperty(this, 'index', {
    value: index,
    enumerable: true
  });
  Object.defineProperty(this, 'item', {
    value: item,
    enumerable: true
  });
}
inherits(DiffArray, Diff);

function arrayRemove(arr, from, to) {
  var rest = arr.slice((to || from) + 1 || arr.length);
  arr.length = from < 0 ? arr.length + from : from;
  arr.push.apply(arr, rest);
  return arr;
}

function realTypeOf(subject) {
  var type = typeof subject;
  if (type !== 'object') {
    return type;
  }

  if (subject === Math) {
    return 'math';
  } else if (subject === null) {
    return 'null';
  } else if (Array.isArray(subject)) {
    return 'array';
  } else if (Object.prototype.toString.call(subject) === '[object Date]') {
    return 'date';
  } else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
    return 'regexp';
  }
  return 'object';
}

function deepDiff(lhs, rhs, changes, prefilter, path, key, stack) {
  path = path || [];
  stack = stack || [];
  var currentPath = path.slice(0);
  if (typeof key !== 'undefined') {
    if (prefilter) {
      if (typeof(prefilter) === 'function' && prefilter(currentPath, key)) {
        return; } else if (typeof(prefilter) === 'object') {
        if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
          return; }
        if (prefilter.normalize) {
          var alt = prefilter.normalize(currentPath, key, lhs, rhs);
          if (alt) {
            lhs = alt[0];
            rhs = alt[1];
          }
        }
      }
    }
    currentPath.push(key);
  }

  // Use string comparison for regexes
  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString();
    rhs = rhs.toString();
  }

  var ltype = typeof lhs;
  var rtype = typeof rhs;

  var ldefined = ltype !== 'undefined' || (stack && stack[stack.length - 1].lhs && stack[stack.length - 1].lhs.hasOwnProperty(key));
  var rdefined = rtype !== 'undefined' || (stack && stack[stack.length - 1].rhs && stack[stack.length - 1].rhs.hasOwnProperty(key));

  if (!ldefined && rdefined) {
    changes(new DiffNew(currentPath, rhs));
  } else if (!rdefined && ldefined) {
    changes(new DiffDeleted(currentPath, lhs));
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes(new DiffEdit(currentPath, lhs, rhs));
  } else if (realTypeOf(lhs) === 'date' && (lhs - rhs) !== 0) {
    changes(new DiffEdit(currentPath, lhs, rhs));
  } else if (ltype === 'object' && lhs !== null && rhs !== null) {
    if (!stack.filter(function(x) {
        return x.lhs === lhs; }).length) {
      stack.push({ lhs: lhs, rhs: rhs });
      if (Array.isArray(lhs)) {
        var i, len = lhs.length;
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
        akeys.forEach(function(k, i) {
          var other = pkeys.indexOf(k);
          if (other >= 0) {
            deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack);
            pkeys = arrayRemove(pkeys, other);
          } else {
            deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack);
          }
        });
        pkeys.forEach(function(k) {
          deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack);
        });
      }
      stack.length = stack.length - 1;
    } else if (lhs !== rhs) {
      // lhs is contains a cycle at this element and it differs from rhs
      changes(new DiffEdit(currentPath, lhs, rhs));
    }
  } else if (lhs !== rhs) {
    if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
      changes(new DiffEdit(currentPath, lhs, rhs));
    }
  }
}

function accumulateDiff(lhs, rhs, prefilter, accum) {
  accum = accum || [];
  deepDiff(lhs, rhs,
    function(diff) {
      if (diff) {
        accum.push(diff);
      }
    },
    prefilter);
  return (accum.length) ? accum : undefined;
}

function applyArrayChange(arr, index, change) {
  if (change.path && change.path.length) {
    var it = arr[index],
      i, u = change.path.length - 1;
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
    switch (change.kind) {
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
    var it = target,
      i = -1,
      last = change.path ? change.path.length - 1 : 0;
    while (++i < last) {
      if (typeof it[change.path[i]] === 'undefined') {
        it[change.path[i]] = (typeof change.path[i] === 'number') ? [] : {};
      }
      it = it[change.path[i]];
    }
    switch (change.kind) {
      case 'A':
        applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item);
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
    var it = arr[index],
      i, u = change.path.length - 1;
    for (i = 0; i < u; i++) {
      it = it[change.path[i]];
    }
    switch (change.kind) {
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
    switch (change.kind) {
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
    var it = target,
      i, u;
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
    var onChange = function(change) {
      if (!filter || filter(target, source, change)) {
        applyChange(target, source, change);
      }
    };
    deepDiff(target, source, onChange);
  }
}

Object.defineProperties(accumulateDiff, {

  diff: {
    value: accumulateDiff,
    enumerable: true
  },
  observableDiff: {
    value: deepDiff,
    enumerable: true
  },
  applyDiff: {
    value: applyDiff,
    enumerable: true
  },
  applyChange: {
    value: applyChange,
    enumerable: true
  },
  revertChange: {
    value: revertChange,
    enumerable: true
  },
  isConflict: {
    value: function() {
      return 'undefined' !== typeof conflict;
    },
    enumerable: true
  },
  noConflict: {
    value: function() {
      if (conflictResolution) {
        conflictResolution.forEach(function(it) {
          it();
        });
        conflictResolution = null;
      }
      return accumulateDiff;
    },
    enumerable: true
  }
});

return accumulateDiff;

})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(_dereq_,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

module.exports = function (ImmutableWrapper) {
  var ChangeHandler = (function () {
    function ChangeHandler() {
      _classCallCheck(this, ChangeHandler);
    }

    _createClass(ChangeHandler, null, [{
      key: 'updateNode',
      value: function updateNode(params) {
        var newWrapper = this._initNode(params);
        params.newWrapper = newWrapper;
        params.childrenDiffs = this._applyChanges(params);
        this._updateChildNodes(params);

        return newWrapper;
      }

      // Create empty node and fill in with link to existing nodes and value.
    }, {
      key: '_initNode',
      value: function _initNode(params) {
        var oldWrapper = params.oldWrapper;
        var root = params.root;
        var eventId = params.eventId;

        var newWrapper;

        if (root) {
          newWrapper = root;
        } else {
          newWrapper = new ImmutableWrapper({
            path: oldWrapper.getPath().slice(),
            eventId: eventId
          });
        }

        // copy old wrapper references into new node
        newWrapper.__wrappers = this._shallowCopy(oldWrapper.__wrappers);
        for (var key in newWrapper.__wrappers) {
          newWrapper.__wrappers[key].__setEventId(eventId);
          newWrapper[key] = newWrapper.__wrappers[key];
        }
        newWrapper.__value = this._shallowCopy(oldWrapper.__value);

        return newWrapper;
      }
    }, {
      key: '_shallowCopy',
      value: function _shallowCopy(obj) {
        var newObj;

        if (ImmutableWrapper.__isObject(obj)) {
          newObj = {};

          for (var key in obj) {
            newObj[key] = obj[key];
          }
        } else if (ImmutableWrapper.__isArray(obj)) {
          newObj = [];

          for (var i = 0, ii = obj.length; i < ii; i++) {
            newObj[i] = obj[i];
          }
        }

        return newObj;
      }

      // Apply diffs for the current level and pass back childrenDiffs to be processed in the nested update call.
    }, {
      key: '_applyChanges',
      value: function _applyChanges(params) {
        var oldWrapper = params.oldWrapper;
        var newWrapper = params.newWrapper;
        var diffs = params.diffs;
        var eventId = params.eventId;

        var childrenDiffs = {};

        for (var i = 0, ii = diffs.length; i < ii; i++) {
          var path = diffs[i].path.slice();

          if (path.length > 1) {
            // Diff is not applicable at this level, we simply pass the diffs onto the next level
            // bucketted by the keys of the nested children so that all diffs of a common node are applied once.
            var childKey = path.shift();
            diffs[i].path = path;
            if (childrenDiffs[childKey]) {
              childrenDiffs[childKey].push(diffs[i]);
            } else {
              childrenDiffs[childKey] = [diffs[i]];
            }
          } else if (path.length === 1) {
            var _diffs$i = diffs[i];
            var action = _diffs$i.action;
            var value = _diffs$i.value;

            var key = diffs[i].path[0];

            if (action === 'add' && ImmutableWrapper.__isArray(newWrapper.__value)) {
              // -1 means end of array, whatever the index is right now
              if (key === -1) {
                key = newWrapper.__value.length;
              }

              newWrapper.__value.splice(key, 0, value);
              newWrapper.__wrappers.splice(key, 0, new ImmutableWrapper({
                value: value,
                path: oldWrapper.__path.concat(key),
                eventId: eventId
              }));
            } else if (action === 'delete') {
              if (ImmutableWrapper.__isObject(newWrapper.__value)) {
                delete newWrapper.__value[key];
                delete newWrapper.__wrappers[key];
                delete newWrapper[key];
              } else if (ImmutableWrapper.__isArray(newWrapper.__value)) {
                var index = 0;
                if (key === -1) {
                  index = newWrapper.__value.length - 1;
                } else if (diffs[i].force) {
                  index = key;
                } else {
                  // Since the it's possible element already got rearrange.
                  // The only signature that's not changed is the __path, so we
                  // go by the index of the element that match the path specified in diff.

                  index = newWrapper.findIndex(function (wrapper) {
                    return wrapper.__path[wrapper.__path.length - 1] === key;
                  });
                }

                newWrapper.__value.splice(index, 1);
                newWrapper.__wrappers.splice(index, 1);
              }
            } else {
              // Update action
              newWrapper.__value[key] = value;
              newWrapper.__wrappers[key] = new ImmutableWrapper({
                value: value,
                path: oldWrapper.__path.concat(key),
                eventId: eventId
              });
              newWrapper[key] = newWrapper.__wrappers[key];
            }
          } else {
            // This only occurs when setting primitive value or destroy() at the root level
            if (diffs[i].action == 'delete') {
              // remove all nested wrapper references
              for (var key in newWrapper.__wrappers) {
                delete newWrapper[key];
              }
              delete newWrapper.__value;
              delete newWrapper.__wrappers;
              return [];
            } else {
              newWrapper.__value = diffs[i].value;
            }
          }
        }

        // Only run this if current array changes length
        if (ImmutableWrapper.__isArray(newWrapper.__value)) {
          // Reorder indices and set path to new value.
          // This needs to be recursive for all nested wrappers.
          for (var j = 0, jj = newWrapper.__wrappers.length; j < jj; j++) {
            this._updateWrapperPath({
              newWrapper: newWrapper.__wrappers[j],
              updatedIndex: j,
              updatedPathIndex: newWrapper.__path.length
            });

            newWrapper[j] = newWrapper.__wrappers[j];
          }

          // Remove extranous elements since we may already remove from array
          while (newWrapper[j]) {
            delete newWrapper[j];
            j += 1;
          }
        }

        return childrenDiffs;
      }
    }, {
      key: '_updateWrapperPath',
      value: function _updateWrapperPath(params) {
        var newWrapper = params.newWrapper;
        var updatedIndex = params.updatedIndex;
        var updatedPathIndex = params.updatedPathIndex;

        var newPath = newWrapper.__path;
        newPath[updatedPathIndex] = updatedIndex;

        if (ImmutableWrapper.__isArray(newWrapper.__value)) {
          for (var i = 0, ii = newWrapper.__wrappers.length; i < ii; i++) {
            this._updateWrapperPath({
              newWrapper: newWrapper.__wrappers[i],
              updatedIndex: updatedIndex,
              updatedPathIndex: updatedPathIndex
            });
          }
        } else if (ImmutableWrapper.__isObject(newWrapper.__value)) {
          for (var key in newWrapper.__wrappers) {
            this._updateWrapperPath({
              newWrapper: newWrapper.__wrappers[key],
              updatedIndex: updatedIndex,
              updatedPathIndex: updatedPathIndex
            });
          }
        }
      }
    }, {
      key: '_updateChildNodes',
      value: function _updateChildNodes(params) {
        var oldWrapper = params.oldWrapper;
        var newWrapper = params.newWrapper;
        var childrenDiffs = params.childrenDiffs;
        var eventId = params.eventId;

        // iterate over set of unapplied diffs and let child nodes handle the changes.
        for (var key in childrenDiffs) {
          newWrapper[key] = newWrapper.__wrappers[key] = this.updateNode({
            oldWrapper: oldWrapper.__wrappers[key],
            diffs: childrenDiffs[key],
            eventId: eventId
          });

          // The current value does not have the value changes from children diffs applied.
          // So we set the affected nested value to that of children.
          newWrapper.__value[key] = newWrapper.__wrappers[key].__value;
        }
      }
    }]);

    return ChangeHandler;
  })();

  return ChangeHandler;
};

},{}],3:[function(_dereq_,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

module.exports = (function () {
  var cortexPubSub = _dereq_("./pubsub"),
      ImmutableWrapper = _dereq_("./immutable_wrapper")(cortexPubSub),
      ChangeHandler = _dereq_("./change_handler")(ImmutableWrapper);

  var Cortex = (function (_ImmutableWrapper) {
    _inherits(Cortex, _ImmutableWrapper);

    function Cortex(value, callback) {
      _classCallCheck(this, Cortex);

      _get(Object.getPrototypeOf(Cortex.prototype), "constructor", this).call(this);

      this.__value = value;
      this.__path = [];
      this.__callbacks = callback ? [callback] : [];
      this.__updating = false;
      this.__subscribe();

      this.__wrap();
    }

    _createClass(Cortex, [{
      key: "onUpdate",
      value: function onUpdate(callback) {
        this.__callbacks.push(callback);
      }
    }, {
      key: "__update",
      value: function __update(diffs) {
        if (diffs.length) {
          if (!this.__updating) {
            this.__diffs = [];
            this.__diffSignature = {};
            this.__updating = true;
            setTimeout(this.__updateAll.bind(this));
          }

          for (var i = 0, ii = diffs.length; i < ii; i++) {
            var sig = JSON.stringify(diffs[i]);

            if (diffs[i].force) {
              this.__diffs.push(diffs[i]);
            } else if (!this.__diffSignature[sig]) {
              // Stringify to get diff signature as unique key to
              // prevent adding duplicate diffs.
              this.__diffSignature[sig] = true;
              this.__diffs.push(diffs[i]);
            }
          }
        }
      }
    }, {
      key: "__subscribe",
      value: function __subscribe() {
        this.__eventId = cortexPubSub.subscribeToCortex((function (topic, data) {
          this.__update(data);
        }).bind(this));
      }
    }, {
      key: "__updateAll",
      value: function __updateAll() {
        if (this.__diffs.length) {
          var updatedCortex = new Cortex();

          updatedCortex = ChangeHandler.updateNode({
            oldWrapper: this,
            root: updatedCortex,
            diffs: this.__diffs,
            eventId: updatedCortex.__eventId
          });

          this.__runCallbacks(updatedCortex);

          updatedCortex.__callbacks = this.__callbacks.slice();

          // Reset everything on the old cortex including unsubscribe from pubsub.
          this.__callbacks = [];
          this.__updating = false;
          delete this.__diffs;
          cortexPubSub.unsubscribeFromCortex(this.__eventId);
        }
      }
    }, {
      key: "__runCallbacks",
      value: function __runCallbacks(updatedCortex) {
        for (var i = 0, ii = this.__callbacks.length; i < ii; i++) {
          if (this.__callbacks[i]) this.__callbacks[i](updatedCortex);
        }
      }
    }]);

    return Cortex;
  })(ImmutableWrapper);

  if (typeof window !== "undefined" && window !== null) {
    window.Cortex = Cortex;
  }

  return Cortex;
})();

},{"./change_handler":2,"./immutable_wrapper":4,"./pubsub":5}],4:[function(_dereq_,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function (cortexPubSub) {
  var _deepDiff = _dereq_("deep-diff").diff;
  var changeMappings = { "N": 'add', "E": 'update', "A": 'add', "D": 'delete' };

  var ImmutableWrapper = (function () {
    function ImmutableWrapper(data) {
      _classCallCheck(this, ImmutableWrapper);

      if (data) {
        this.__eventId = data.eventId;
        this.__value = data.value;
        this.__path = data.path || [];
      }

      this.__wrap();

      this.val = this.getValue;
    }

    _createClass(ImmutableWrapper, [{
      key: "getValue",
      value: function getValue() {
        return this.__value;
      }
    }, {
      key: "getPath",
      value: function getPath() {
        return this.__path;
      }
    }, {
      key: "getKey",
      value: function getKey() {
        return this.__path[this.__path.length - 1];
      }
    }, {
      key: "set",
      value: function set(value) {
        var rawDiffs = this.constructor.deepDiff(this.__value, value);
        if (rawDiffs) {
          var diffs = [],
              diff,
              path;

          for (var i = 0, ii = rawDiffs.length; i < ii; i++) {
            path = this.__path.slice();
            diff = rawDiffs[i];

            // Diff path may not be present if value is shallow
            if (diff.path) path = path.concat(diff.path);

            // Both index and path may be available
            if (typeof diff.index !== 'undefined') path.push(diff.index);

            diffs.push({
              action: changeMappings[diff.item ? diff.item.kind : diff.kind],
              path: path,
              value: diff.item ? diff.item.rhs : diff.rhs
            });
          }

          this.__notifyUpdate(diffs);
        }
      }
    }, {
      key: "forEach",
      value: function forEach(callback) {
        if (this.constructor.__isObject(this.__wrappers)) {
          for (var key in this.__wrappers) {
            callback(key, this.__wrappers[key], this.__wrappers);
          }
        } else if (this.constructor.__isArray(this.__wrappers)) {
          this.__wrappers.forEach(callback);
        }
      }
    }, {
      key: "destroy",
      value: function destroy() {
        var diffs = [{
          action: 'delete',
          path: this.__path.slice()
        }];

        this.__notifyUpdate(diffs);
      }
    }, {
      key: "__forceUpdate",
      value: function __forceUpdate(action, key, value) {
        var diffs = [{
          action: action,
          path: this.__path.concat(key),
          value: value,
          force: true
        }];

        this.__notifyUpdate(diffs);
      }
    }, {
      key: "__notifyUpdate",
      value: function __notifyUpdate(diffs) {
        if (diffs && diffs.length) {
          cortexPubSub.publish("update" + this.__eventId, diffs);
        }
      }
    }, {
      key: "__setEventId",
      value: function __setEventId(eventId) {
        this.__eventId = eventId;
        for (var key in this.__wrappers) {
          this.__wrappers[key].__setEventId(eventId);
        }
      }
    }, {
      key: "__wrap",
      value: function __wrap() {
        if (this.constructor.__isObject(this.__value)) {
          this.__wrappers = {};
          for (var key in this.__value) {
            this.__wrapChild(key);
          }
        } else if (this.constructor.__isArray(this.__value)) {
          this.__wrappers = [];
          for (var index = 0, length = this.__value.length; index < length; index++) {
            this.__wrapChild(index);
          }
        }
      }
    }, {
      key: "__wrapChild",
      value: function __wrapChild(key) {
        var path = this.__path.slice();
        path.push(key);
        this.__wrappers[key] = new ImmutableWrapper({
          value: this.__value[key],
          path: path,
          eventId: this.__eventId
        });
        this[key] = this.__wrappers[key];
      }
    }], [{
      key: "deepDiff",
      value: function deepDiff(oldValue, newValue) {
        return _deepDiff(oldValue, newValue);
      }
    }, {
      key: "__isObject",
      value: function __isObject(obj) {
        return obj && obj.constructor === Object;
      }
    }, {
      key: "__isArray",
      value: function __isArray(arr) {
        return arr && arr.constructor === Array;
      }
    }]);

    return ImmutableWrapper;
  })();

  var ArrayWrapper = _dereq_("./wrappers/array_wrapper");
  var ObjectWrapper = _dereq_("./wrappers/object_wrapper");

  var __include = function __include(klass, mixins) {
    for (var i = 0, ii = mixins.length; i < ii; i++) {
      for (var methodName in mixins[i]) {
        klass.prototype[methodName] = mixins[i][methodName];
      }
    }
  };

  __include(ImmutableWrapper, [ArrayWrapper, ObjectWrapper]);

  return ImmutableWrapper;
};

},{"./wrappers/array_wrapper":6,"./wrappers/object_wrapper":7,"deep-diff":1}],5:[function(_dereq_,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = (function () {
  var PubSub = (function () {
    function PubSub() {
      _classCallCheck(this, PubSub);

      this.uid = -1;
      this.topics = {};
    }

    _createClass(PubSub, [{
      key: "subscribe",
      value: function subscribe(topic, callback) {
        if (!this.topics.hasOwnProperty(topic)) {
          this.topics[topic] = [];
        }
        this.topics[topic].push({ callback: callback });
      }
    }, {
      key: "publish",
      value: function publish(topic, data) {
        if (!this.topics.hasOwnProperty(topic)) {
          return false;
        }

        var subscribers = this.topics[topic];

        for (var i = 0, ii = subscribers.length; i < ii; i++) {
          subscribers[i].callback(topic, data);
        }

        return true;
      }
    }, {
      key: "subscribeToCortex",
      value: function subscribeToCortex(updateCallback, removeCallback) {
        this.uid += 1;
        this.subscribe("update" + this.uid, updateCallback);
        this.subscribe("remove" + this.uid, removeCallback);
        return this.uid;
      }
    }, {
      key: "unsubscribeFromCortex",
      value: function unsubscribeFromCortex(topicId) {
        delete this.topics["update" + topicId];
        delete this.topics["remove" + topicId];
      }
    }]);

    return PubSub;
  })();

  return new PubSub();
})();

},{}],6:[function(_dereq_,module,exports){
'use strict';

var ArrayWrapper = {
  count: function count() {
    return this.__value.length;
  },

  map: function map(callback, thisArg) {
    return this.__wrappers.map(callback, thisArg);
  },

  filter: function filter(callback, thisArg) {
    return this.__wrappers.filter(callback, thisArg);
  },

  find: function find(callback) {
    for (var index = 0, length = this.__wrappers.length; index < length; index++) {
      if (callback(this.__wrappers[index], index, this.__wrappers)) {
        return this.__wrappers[index];
      }
    }
    return undefined;
  },

  findIndex: function findIndex(callback) {
    for (var index = 0, length = this.__wrappers.length; index < length; index++) {
      if (callback(this.__wrappers[index], index, this.__wrappers)) {
        return index;
      }
    }
    return -1;
  },

  // A limitation of these 'add' methods is it can only generate
  // one value change per diff
  // one way to improve is to create a new action 'concat'
  // that insert the array as multiple elements instead of treating
  // the array as a single element. This unwraps value as array and then add

  // add spec that push/unshift empty input
  // should not error
  // should not change anything
  push: function push() {
    var values = Array.prototype.slice.call(arguments);
    var diffs = [];

    // Use -1 to indicate end of array because we don't mutate in-place
    // so there's no way to tell the current values in array.
    for (var i = 0, ii = values.length; i < ii; i++) {
      diffs.push({
        action: 'add',
        path: this.__path.concat(-1),
        value: values[i],
        force: true
      });
    }

    this.__notifyUpdate(diffs);
  },

  pop: function pop() {
    this.__forceUpdate('delete', -1);
  },

  unshift: function unshift() {
    var values = Array.prototype.slice.call(arguments);
    var diffs = [];

    for (var i = 0, ii = values.length; i < ii; i++) {
      // Unshift so that the diffs come out in reverse order
      // making the last diffs showing up first in the array.
      diffs.unshift({
        action: 'add',
        path: this.__path.concat(0),
        value: values[i],
        force: true
      });
    }

    this.__notifyUpdate(diffs);
  },

  shift: function shift() {
    this.__forceUpdate('delete', 0);
  },

  splice: function splice(index) {
    var howMany = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

    var values = Array.prototype.slice.call(arguments, 2);
    var diffs = [];

    // create delete diffs first.
    // Notice we don't specify index as index + i because
    // elements are deleted one at the time so it would always be
    // at the same index.
    for (var i = 0; i < howMany; i++) {
      diffs.push({
        action: 'delete',
        path: this.__path.concat(index),
        force: true
      });
    }

    // insert diffs
    for (var i = 0, ii = values.length; i < ii; i++) {
      diffs.push({
        action: 'add',
        path: this.__path.concat(index + i),
        value: values[i],
        force: true
      });
    }

    this.__notifyUpdate(diffs);
  }
};

module.exports = ArrayWrapper;

},{}],7:[function(_dereq_,module,exports){
'use strict';

var ObjectWrapper = {
  keys: function keys() {
    return Object.keys(this.__value);
  },

  values: function values() {
    var values = [];
    for (var key in this.__value) {
      values.push(this.__value[key]);
    }

    return values;
  },

  hasKey: function hasKey(key) {
    return this.__value[key] !== undefined;
  },

  remove: function remove(key) {
    if (key !== undefined && key !== null && this.hasKey(key)) this.__wrappers[key].destroy();
  },

  merge: function merge(obj) {
    var diffs = [];
    for (var key in obj) {
      diffs.push({
        action: 'update',
        path: this.__path.concat(key),
        value: obj[key]
      });
    }

    this.__notifyUpdate(diffs);
  }
};

module.exports = ObjectWrapper;

},{}]},{},[3])(3)
});