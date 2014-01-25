Path = require("../src/path")

describe "Path", ->
  describe "#getKey", ->
    it "returns key", ->
      key = "myKey"
      path = new Path(null, key)

      expect(path.getKey()).toBe(key)

  describe "#getParent", ->
    it "returns parent", ->
      parent = new Path(null, "key1")
      path = new Path(parent, "key2")

      expect(path.getParent()).toBe(parent)

    it "returns null when parent is null", ->
      path = new Path(null, "key")

      expect(path.getParent()).toBe(null)

  describe "#getPath", ->
    it "returns full path", ->
      key1 = "key1"
      key2 = "key2"
      parent = new Path(null, key1)
      path = new Path(parent, key2)
      fullPath = path.getPath()

      expect(fullPath).toEqual([key1, key2])
