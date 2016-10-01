module.exports = function(ImmutableWrapper) {
  class ChangeHandler {
    static updateNode(params) {
      var newWrapper = this._initNode(params);
      params.newWrapper = newWrapper;
      params.childrenDiffs = this._applyChanges(params);
      this._updateChildNodes(params);

      return newWrapper;
    }

    // Create empty node and fill in with link to existing nodes and value.
    static _initNode(params) {
      let { oldWrapper, root, eventId } = params
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
      for(var key in newWrapper.__wrappers) {
        newWrapper.__wrappers[key].__setEventId(eventId);
        newWrapper[key] = newWrapper.__wrappers[key];
      }
      newWrapper.__value = this._shallowCopy(oldWrapper.__value);

      return newWrapper;
    }

    static _shallowCopy(obj) {
      var newObj;

      if(ImmutableWrapper.__isObject(obj)) {
        newObj = {};

        for (var key in obj) {
          newObj[key] = obj[key];
        }
      } else if (ImmutableWrapper.__isArray(obj)) {
        newObj = [];

        for(var i = 0, ii = obj.length;i < ii; i++) {
          newObj[i] = obj[i];
        }
      }

      return newObj;
    }

    // Apply diffs for the current level and pass back childrenDiffs to be processed in the nested update call.
    static _applyChanges(params) {
      var { oldWrapper, newWrapper, diffs, eventId } = params;
      var childrenDiffs = {};

      for(var i = 0, ii = diffs.length; i < ii; i++) {
        var path = diffs[i].path.slice();

        if (path.length > 1) {
          // Diff is not applicable at this level, we simply pass the diffs onto the next level
          // bucketted by the keys of the nested children so that all diffs of a common node are applied once.
          let childKey = path.shift();
          diffs[i].path = path;
          if (childrenDiffs[childKey]) {
            childrenDiffs[childKey].push(diffs[i]);
          } else {
            childrenDiffs[childKey] = [diffs[i]];
          }
        } else if(path.length === 1) {
          let { action, value } = diffs[i];
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
          } else if(action === 'delete') {
            if (ImmutableWrapper.__isObject(newWrapper.__value)) {
              delete newWrapper.__value[key];
              delete newWrapper.__wrappers[key];
              delete newWrapper[key];
            }
            else if(ImmutableWrapper.__isArray(newWrapper.__value)) {
              var index = 0;
              if (key === -1) {
                index = newWrapper.__value.length - 1;
              } else if (diffs[i].force) {
                index = key;
              } else {
                // Since the it's possible element already got rearrange.
                // The only signature that's not changed is the __path, so we
                // go by the index of the element that match the path specified in diff.

                index = newWrapper.findIndex(function(wrapper) {
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
            for(var key in newWrapper.__wrappers) {
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
      if(ImmutableWrapper.__isArray(newWrapper.__value)) {
        // Reorder indices and set path to new value.
        // This needs to be recursive for all nested wrappers.
        for(var j = 0, jj = newWrapper.__wrappers.length; j < jj; j++) {
          this._updateWrapperPath({
            newWrapper: newWrapper.__wrappers[j],
            updatedIndex: j,
            updatedPathIndex: newWrapper.__path.length
          });

          newWrapper[j] = newWrapper.__wrappers[j];
        }

        // Remove extranous elements since we may already remove from array
        while (newWrapper[j]){
          delete newWrapper[j];
          j += 1;
        }
      }

      return childrenDiffs;
    }

    static _updateWrapperPath(params) {
      var { newWrapper, updatedIndex, updatedPathIndex } = params;
      var newPath = newWrapper.__path;
      newPath[updatedPathIndex] = updatedIndex;

      if (ImmutableWrapper.__isArray(newWrapper.__value)) {
        for(var i = 0, ii = newWrapper.__wrappers.length; i < ii; i++) {
          this._updateWrapperPath({
            newWrapper: newWrapper.__wrappers[i],
            updatedIndex: updatedIndex,
            updatedPathIndex: updatedPathIndex
          });
        }
      } else if (ImmutableWrapper.__isObject(newWrapper.__value)) {
        for(var key in newWrapper.__wrappers) {
          this._updateWrapperPath({
            newWrapper: newWrapper.__wrappers[key],
            updatedIndex: updatedIndex,
            updatedPathIndex: updatedPathIndex
          });
        }
      }
    }

    static _updateChildNodes(params) {
      var { oldWrapper, newWrapper, childrenDiffs, eventId } = params;
      // iterate over set of unapplied diffs and let child nodes handle the changes.
      for(var key in childrenDiffs) {
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
  }

  return ChangeHandler;
};