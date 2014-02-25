var __include = function(klass, mixins) {
  for(var i=0,ii=mixins.length;i<ii;i++) {
    for(var methodName in mixins[i]) {
      klass.prototype[methodName] = mixins[i][methodName];
    }
  }
};

module.exports = function(_mixins, _cortexPubSub) {
  function DataWrapper(value, path, eventId) {
    this.__eventId = eventId;
    this.__value = value;
    this.__path = path || [];
    this.__wrap();
  }

  DataWrapper.prototype.set = function(value, forceUpdate) {
    _cortexPubSub.publish("update" + this.__eventId, {value: value, path: this.__path, forceUpdate: forceUpdate});
  };

  DataWrapper.prototype.getValue = function() {
    return this.__value;
  };

  // Short alias for getValue
  DataWrapper.prototype.val = DataWrapper.prototype.getValue;

  DataWrapper.prototype.getPath = function() {
    return this.__path;
  };

  DataWrapper.prototype.getKey = function() {
    return this.__path[this.__path.length - 1];
  };

  DataWrapper.prototype.forEach = function(callback) {
    if(this.__isObject()) {
      for(var key in this.__wrappers) {
        callback(key, this.__wrappers[key], this.__wrappers);
      }
    } else if(this.__isArray()) {
      this.__wrappers.forEach(callback);
    }
  };

  DataWrapper.prototype.remove = function() {
    _cortexPubSub.publish("remove" + this.__eventId, {path: this.__path});
  };

  // Recursively wrap data if @value is a hash or an array.
  // Otherwise there's no need to further wrap primitive or other class instances
  DataWrapper.prototype.__wrap = function() {
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
  };

  DataWrapper.prototype.__cleanup = function() {
    if(this.__wrappers) {
      if(this.__isObject()) {
        for(var key in this.__wrappers) {
          delete this[key];
        }
      } else if(this.__isArray()) {
        for(var i=0,ii=this.__wrappers.length;i<ii;i++) {
          delete this[i];
        }
      }
      delete this.__wrappers;
    }
  };

  DataWrapper.prototype.__forceUpdate = function() {
    this.set(this.__value, true);
  };

  DataWrapper.prototype.__isObject = function() {
    return this.__value && this.__value.constructor === Object;
  };

  DataWrapper.prototype.__isArray = function() {
    return this.__value && this.__value.constructor === Array;
  };

  __include(DataWrapper, _mixins);

  return DataWrapper;
};
