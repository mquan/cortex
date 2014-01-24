DataWrapper = require("./data_wrapper")

class Cortex extends DataWrapper
  constructor: (@value, @callback) ->
    @_wrap()

  update: (params) ->
    @_setValue(params.value, params.path)
    @_wrap()

    @callback(this) if @callback

  _setValue: (newValue, path) ->
    # When saving an object to a variable it's pass by reference, but when doing so for a primitive value
    # it's pass by value. We avoid this pass by value problem by only setting subValue when path length is greater
    # than 2 (meaning it can't never be a primitive). When path is 0 or 1 we set the value directly.
    if path.length > 1
      subValue = @value
      subValue = subValue[key] for key in path[0..path.length-2]
      subValue[path[path.length-1]] = newValue
    else if path.length == 1
      @value[path[0]] = newValue
    else
      @value = newValue

window.Cortex = Cortex
