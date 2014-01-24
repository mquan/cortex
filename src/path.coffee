class Path
  constructor: (@parent, @key) ->

  getKey: ->
    @key

  getParent: ->
    @parent

  getPath: (path = []) ->
    path.splice(0, 0, @key)
    if @parent?
      return @parent.getPath(path)
    else
      return path

module.exports = Path
