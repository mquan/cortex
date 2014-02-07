DataWrapper = require("./data_wrapper")

class Cortex extends DataWrapper
  constructor: (@value, @callback) ->
    @_wrap()

  update: (newValue, path, forceUpdate = false) ->
    return false if !forceUpdate && !@_shouldUpdate(newValue, path)

    @_setValue(newValue, path)
    @_wrap()
    @callback(this) if @callback

  _setValue: (newValue, path, forceUpdate) ->
    # When saving an object to a variable it's pass by reference, but when doing so for a primitive value
    # it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
    # than 2 (meaning it can't never be a primitive). When path length is 0 or 1 we set the value directly.
    if path.length > 1
      subValue = @value
      subValue = subValue[key] for key in path[0..path.length-2]
      subValue[path[path.length-1]] = newValue
    else if path.length == 1
      @value[path[0]] = newValue
    else
      @value = newValue
    true

  # Check whether newValue is different, if not then return false to bypass rewrap and running callback.
  _shouldUpdate: (newValue, path) ->
    oldValue = @value
    oldValue = oldValue[key] for key in path
    return @_isDifferent(oldValue, newValue)

  # Recursively performs comparison b/w old and new data
  _isDifferent: (oldValue, newValue) ->
    if oldValue.constructor == Object
      return true if newValue.constructor != Object || @_isDifferent(Object.keys(oldValue).sort(), Object.keys(newValue).sort())
      for key, val of oldValue
        return true if @_isDifferent(oldValue[key], newValue[key])
    else if oldValue.constructor == Array
      return true if newValue.constructor != Array || oldValue.length != newValue.length
      for val, i in oldValue
        return true if @_isDifferent(oldValue[i], newValue[i])
    else
      oldValue != newValue

window.Cortex = Cortex if window?

module.exports = Cortex
