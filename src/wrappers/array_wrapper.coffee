ArrayWrapper =
  length: ->
    @wrappers.length

  forEach: (callback) ->
    @wrappers.forEach(callback)

  map: (callback) ->
    @wrappers.map(callback)

  find: (callback) ->
    @wrappers.find(callback)

  indexOf: (wrapperElement) ->
    @wrappers.indexOf(wrapperElement)

  indexOfValue: (value) ->
    @value.indexOf(value)

  push: (value) ->
    length = @values.push(value)
    @set(@values)
    return length

  pop: ->
    last = @values.pop()
    @set(@values)
    return last

  insertAt: (index, value) ->
    @values.splice(index, 0, value)
    @set(@values)

  removeAt: (index, howMany) ->
    removed = @values.splice(index, howMany)
    @set(@values)
    return removed

module.exports = ArrayWrapper
