var __include = function(klass, mixins) {
  for(var i=0,ii=mixins.length;i<ii;i++) {
    for(var methodName in mixins[i]) {
      klass.prototype[methodName] = mixins[i][methodName];
    }
  }
};

module.exports = function(_mixins, _cortexPubSub) {
  function DataWrapper(value, path, eventId) {
    this.eventId = eventId;
    this.value = value;
    this.path = path || [];
    this._wrap();
  }

  DataWrapper.prototype.set = function(value, forceUpdate) {
    _cortexPubSub.publish("update" + this.eventId, {value: value, path: this.path, forceUpdate: forceUpdate});
  };

  DataWrapper.prototype.get = function(key) {
    return this.wrappers[key];
  };

  DataWrapper.prototype.getValue = function() {
    return this.value;
  };

  DataWrapper.prototype.getPath = function() {
    return this.path;
  };

  DataWrapper.prototype.getKey = function() {
    return this.path[this.path.length - 1];
  };

  DataWrapper.prototype.forEach = function(callback) {
    if(this._isObject()) {
      for(var key in this.wrappers) {
        callback(key, this.wrappers[key], this.wrappers);
      }
    } else if(this._isArray()) {
      this.wrappers.forEach(callback);
    }
  };

  DataWrapper.prototype.remove = function() {
    _cortexPubSub.publish("remove" + this.eventId, {path: this.path});
  };

  // Recursively wrap data if @value is a hash or an array.
  // Otherwise there's no need to further wrap primitive or other class instances
  DataWrapper.prototype._wrap = function() {
    delete this.wrappers;
    var path;
    if(this._isObject()) {
      this.wrappers = {};
      for(var key in this.value) {
        path = this.path.slice();
        path.push(key);
        this.wrappers[key] = new DataWrapper(this.value[key], path, this.eventId);
      }
    } else if (this._isArray()) {
      this.wrappers = [];
      for(var i = 0, ii = this.value.length;i < ii; i++) {
        path = this.path.slice();
        path.push(i);
        this.wrappers.push(new DataWrapper(this.value[i], path, this.eventId));
      }
    }
  };

  DataWrapper.prototype._forceUpdate = function() {
    this.set(this.value, true);
  };

  DataWrapper.prototype._isObject = function() {
    return this.value.constructor == Object;
  };

  DataWrapper.prototype._isArray = function() {
    return this.value.constructor == Array;
  };

  __include(DataWrapper, _mixins);

  return DataWrapper;
};
