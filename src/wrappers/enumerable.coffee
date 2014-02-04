EnumerableWrapper =
  count: ->
    @value.length

  forEach: (callback) ->
    if @wrappers.constructor == Object
      callback(key, wrapper) for key, wrapper of @wrappers
    else if @wrappers.constructor == Array
      @wrappers.forEach(callback)

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
    @set(@value)
    return last

  insertAt: (index, value) ->
    # Use apply to handle value as a single value or an array.
    args = [index, 0].concat(value)
    Array.prototype.splice.apply(@value, args)
    @set(@value)

  removeAt: (index, howMany = 1) ->
    if @value.splice
      removed = @value.splice(index, howMany)
    else if @wrappers.constructor == Object
      removed = @value[index]
      delete @value[index]
      delete @wrappers[index]
    @set(@value)
    return removed

  delete: ->
    if @path and @parentWrapper
      @parentWrapper.removeAt(@path.getKey())


module.exports = EnumerableWrapper
