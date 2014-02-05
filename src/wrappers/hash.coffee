HashWrapper =
  keys: ->
    Object.keys(@value)

  values: ->
    values = []
    values.push(val) for key, val of @value
    values

  hasKey: (key) ->
    @value[key]?

  delete: (key) ->
    removed = @value[key]
    delete @value[key]
    @set(@value)
    removed

module.exports = HashWrapper
