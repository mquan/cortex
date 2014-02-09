Path = require("./path")
ArrayWrapper = require("./wrappers/array")
HashWrapper = require("./wrappers/hash")
SharedWrapper = require("./wrappers/shared")

class DataWrapper
  constructor: (@value, @path = null, @parentWrapper = null) ->
    @_wrap()

  set: (value, forceUpdate = false) ->
    @_getRoot().update(value, @getPath(), forceUpdate)

  get: (key) ->
    @wrappers[key]

  getValue: ->
    @value
    
  valueOf: ->
    @value

  getPath: ->
    if @path? then @path.getPath() else []

  _getRoot: ->
    if @parentWrapper?
      @parentWrapper._getRoot()
    else
      return this

  # Recursively wrap data if @value is a hash or an array.
  # Otherwise there's no need to further wrap primitive or other class instances
  _wrap: ->
    @wrappers = null
    if typeof(@value) == "object"
      if @value.constructor == Object
        @wrappers = {}
        for key, val of @value
          path = new Path(@path, key)
          @wrappers[key] = new DataWrapper(val, path, this)
      else if @value.constructor == Array
        @wrappers = []
        for val,i in @value
          path = new Path(@path, i)
          @wrappers.push(new DataWrapper(val, path, this))

_extend = (obj, mixin) ->
  obj[name] = method for name, method of mixin

_include = (klass, mixins) ->
  _extend(klass.prototype, mixin) for mixin in mixins

_include(DataWrapper, [ArrayWrapper, HashWrapper, SharedWrapper])

module.exports = DataWrapper
