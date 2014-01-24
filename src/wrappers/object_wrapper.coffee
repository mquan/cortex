ObjectWrapper =
  keys: ->
    @values.keys()

  forEach: (callback) ->
    for key, wrapper of @wrappers
      callback(key, wrapper)

module.exports = ObjectWrapper
