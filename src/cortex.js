module.exports = (function() {
  var cortexPubSub = require("./pubsub"),
      DataWrapper = require("./data_wrapper")(cortexPubSub),
      changeMappings = {"N": "new", "E": "update", "A": "update", "D": "delete"};

  class Cortex extends DataWrapper {
    constructor(value, callback) {
      super()
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

    update(data) {
      if(this.__checkUpdate(data.oldValue, data.value, data.path)) {
        // Schedule value setting, rewrapping, and running callbacks in batch so that multiple updates
        // in the same event loop only result in a single rewrap and callbacks run.
        if(!this.__loopProcessing) {
          this.__loopProcessing = true;

          setTimeout((this.__batchAll).bind(this), 0);
        }

        return true;
      } else {
        return false;
      }
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
      for(var i = 0, ii = this.__updates.length; i < ii; i++) {
        this.__setValue(this.__updates[i].newValue, this.__updates[i].path);
      }

      this.__updates = [];
    }

    __runCallbacks() {
      for (var i = 0, ii = this.__callbacks.length; i < ii; i++) {
        if(this.__callbacks[i])
          this.__callbacks[i](this);
      }
    };

    __subscribe() {
      this.__eventId = cortexPubSub.subscribeToCortex((function(topic, data) {
        this.update(data);
      }).bind(this), (function(topic, data) {
        this.__remove(data.path);
      }).bind(this));
    }

    __remove(path) {
      if(path.length) {
        var subPath = path.slice(0, path.length - 1),
            subValue = this.__subValue(subPath),
            key = path[path.length - 1],
            removed = subValue[key],
            oldValue = this.__clone(subValue);

        if(subValue.constructor === Object) {
          delete subValue[key];
        } else if(subValue.constructor === Array) {
          subValue.splice(key, 1);
        }
        this.update({value: subValue, path: subPath, oldValue: oldValue});
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

        subValue[path[path.length - 1]] = newValue;
      } else if(path.length === 1) {
        this.__value[path[0]] = newValue;
      } else {
        this.__value = newValue;
      }
    }

    // Check whether newValue is different, if not then return false to bypass rewrap and running callbacks.
    // Note that we cannot compare stringified values of old and new data because order of keys cannot be guaranteed.
    __checkUpdate(oldValue, newValue, path) {
      var diffs;

      if(oldValue) {
        diffs = this.__diff(oldValue, newValue);
        this.__computeChanges(diffs, path);
        return true;
      } else {
        var oldValue = this.__subValue(path);
        diffs = this.__diff(oldValue, newValue);

        if(diffs) {
          // Add to queue to update in batch later.
          this.__updates.push({newValue: newValue, path: path});

          this.__computeChanges(diffs, path);
          return true;
        } else {
          return false
        }
      }
    }

    // changes = [{kind: ('new' || 'update' || 'delete'), path: [...], oldValue: ..., newValue: ...}]
    __computeChanges(diffs, path) {
      var changeType, diffPath, diff;

      // Reset changes at beginning of event loop. This has to be done after new changes are detected because
      // we don't want to override previous changes if current update does not result in any new change.
      if(!this.__loopProcessing) {
        this.__changes = [];
      }

      for(var i = 0, ii = diffs.length; i < ii; i++) {
        diff = diffs[i];
        // Raw deep diff sample: {"kind":"A","path":[1,"b"],"index":1,"item":{"kind":"N","rhs":1}}
        // Use the change type closest to the change.
        changeType = changeMappings[diff.item ? diff.item.kind : diff.kind];

        diffPath = path.slice();

        if(diff.path) {
          diffPath = diffPath.concat(diff.path);
        }

        if(diff.index) {
          diffPath.push(diff.index);
        }

        this.__changes.push({
          type: changeType,
          path: diffPath,
          oldValue: diff.item ? diff.item.lhs : diff.lhs,
          newValue: diff.item ? diff.item.rhs : diff.rhs
        });
      }
    }
  }

  if(typeof window !== "undefined" && window !== null) {
    window.Cortex = Cortex;
  }

  return Cortex;
})();
