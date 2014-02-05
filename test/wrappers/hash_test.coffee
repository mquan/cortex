Cortex = require("../../src/cortex")

describe "HashWrapper", ->
  beforeEach ->
    @value = {a: 1, b: 2, c: 3}
    @wrapper = new Cortex(@value)

  describe "#keys", ->
    it "returns an array of the keys", ->
      expect(@wrapper.keys()).toEqual(["a", "b", "c"])

  describe "#values", ->
    it "returns an array of the values", ->
      expect(@wrapper.values()).toEqual([1, 2, 3])

  describe "#hasKey", ->
    it "returns true when key exists", ->
      expect(@wrapper.hasKey("a")).toBe(true)

    it "returns false when key does not exist", ->
      expect(@wrapper.hasKey("xyz")).toBe(false)

  describe "#delete", ->
    it "removes specified key value pair", ->
      expect(@wrapper.delete("a")).toBe(1)

      expect(@wrapper.get("a")).toBe(undefined)
      expect(@wrapper.get("b").getValue()).toBe(2)
      expect(@wrapper.get("c").getValue()).toBe(3)
