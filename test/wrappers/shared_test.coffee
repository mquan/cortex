Cortex = require("../../src/cortex")

describe "SharedWrapper", ->
  describe "#forEach", ->
    describe "when array", ->
      it "iterates over all elements of wrapper array", ->
        value = [1, 1, 2, 3, 5, 8, 13]
        wrapper = new Cortex(value)
        out = []
        wrapper.forEach (obj) ->
          out.push(obj.getValue())

        expect(out).toEqual(value)

    describe "when an object", ->
      it "iterates over every key and element pair in the object", ->
        value = {a: 1, b: 2, c: 3}
        wrapper = new Cortex(value)

        out = []
        wrapper.forEach (key, wrapper) ->
          out.push("#{key}:#{wrapper.getValue()}")

        expect(out).toEqual(["a:1", "b:2", "c:3"])

  describe "#remove", ->
    describe "when not a root", ->
      describe "when parent is an array", ->
        it "removes the specified element in parent array", ->
          value = [1, 2, 3, 4, 5]
          length = value.length
          wrapper = new Cortex(value)
          wrapper.get(0).remove()

          expect(wrapper.count()).toBe(length - 1)
          expect(wrapper.get(0).getValue()).toBe(2)

      describe "when parent is a hash", ->
        it "removes the specified key and value pair", ->
          value = {a: 1, b: 2, c: 3}
          wrapper = new Cortex(value)
          wrapper.get("a").remove()

          expect(wrapper.get("a")).toBe(undefined)
          expect(wrapper.hasKey("a")).toBe(false)

    describe "when a root", ->
      it "removes itself", ->
        wrapper = new Cortex(1)
        wrapper.remove()

        expect(wrapper.getValue()).toBe(undefined)

