ArrayWrapper =
  count: ->
    @value.length

  map: (callback) ->
    @wrappers.map(callback)

  find: (callback) ->
    for wrapper, index in @wrappers when callback(wrapper, index, @wrappers)
      return wrapper
    null

  findIndex: (callback) ->
    for wrapper, index in @wrappers when callback(wrapper, index, @wrappers)
      return index
    return -1

  push: (value) ->
    length = @value.push(value)
    @set(@value)
    return length

  pop: ->
    last = @value.pop()
    @wrappers.pop()
    @set(@value)
    return last

  insertAt: (index, value) ->
    # Use apply to handle value as a single value or an array.
    args = [index, 0].concat(value)
    Array.prototype.splice.apply(@value, args)
    @set(@value)

  removeAt: (index, howMany = 1) ->
    removed = @value.splice(index, howMany)
    @set(@value)
    return removed

module.exports = ArrayWrapper
