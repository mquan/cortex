Cortex = require("../src/cortex")

describe "Cortex", ->
  beforeEach ->
    @value = {
      a: 1,
      b: {
        key1: "hello",
        key2: {
          key3: { nested: [1, 2, 3] }
        }
      },
      c: [0, 1, 2]
    }

  describe "#update", ->
    it "runs callback", ->
      called = false
      cortex = new Cortex(@value, ->
        called = true
      )
      cortex.update({path: [], value: {}})

      expect(called).toBe(true)

    it "sets value to new data", ->
      cortex = new Cortex(@value)
      newValue = {foo: "bar"}
      cortex.update({path: [], value: newValue})

      expect(cortex.getValue()).toEqual(newValue)

    it "sets value of a key", ->
      cortex = new Cortex(@value)
      newValue = 100
      cortex.update({path: [cortex.get("a").getPath()], value: newValue})

      expect(cortex.getValue()["a"]).toEqual(newValue)

    it "sets value of a nested object", ->
      cortex = new Cortex(@value)
      newValue = {nested: [100, 200, 300]}
      path = cortex.get("b").get("key2").get("key3").getPath()
      cortex.update({path: path, value: newValue})

      expect(cortex.getValue()["b"]["key2"]["key3"]).toEqual(newValue)

    it "sets value of an array element", ->
      cortex = new Cortex(@value)
      newValue = [0, 11, 22]
      path = cortex.get("c").getPath()
      cortex.update({path: path, value: newValue})

      expect(cortex.getValue()["c"]).toEqual(newValue)

    it "sets a primitive value in an array", ->
      cortex = new Cortex(@value)
      newValue = -1
      path = cortex.get("c").get(0).getPath()
      cortex.update({path: path, value: newValue})

      expect(cortex.getValue()["c"][0]).toEqual(newValue)
