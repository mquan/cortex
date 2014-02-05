SharedWrapper =
  forEach: (callback) ->
    if @wrappers.constructor == Object
      callback(key, wrapper) for key, wrapper of @wrappers
    else if @wrappers.constructor == Array
      @wrappers.forEach(callback)

  remove: ->
    if @parentWrapper
      if @parentWrapper.getValue().constructor == Object
        @parentWrapper.delete(@path.getKey())
      else if @parentWrapper.getValue().constructor == Array
        @parentWrapper.removeAt(@path.getKey())
    else
      delete @value
      delete @wrappers

module.exports = SharedWrapper
