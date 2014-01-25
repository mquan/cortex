DataWrapper = require("../src/data_wrapper")

describe "DataWrapper", ->
  describe "#get", ->
    describe "when data is a hash", ->
      beforeEach ->
        @value = {}
        @key = "foo"
        @val = "bar"
        @value[@key] = @val
        @wrapper = new DataWrapper(@value)

      it "returns wrapper of nested value", ->
        nestedWrapper = @wrapper.get(@key)

        expect(nestedWrapper.getValue()).toBe(@val)

      it "returns undefined when key is not defined", ->
        expect(@wrapper.get("randomKey")).toBe(undefined)

    describe "when data is an array", ->
      beforeEach ->
        @value = [1, 2, 3]
        @wrapper = new DataWrapper(@value)

      it "returns wrapper of an array element", ->
        index = 1
        nestedWrapper = @wrapper.get(index)

        expect(nestedWrapper.getValue()).toBe(@value[index])

      it "returns undefined when element is not in array", ->
        index = @value.length
        nestedWrapper = @wrapper.get(index)

        expect(nestedWrapper).toBe(undefined)

  describe "#set", ->
    it "calls update on top level wrapper", ->
      value = {a: {b: [1,2,3]}}
      # Stub Cortex with update method
      wrapper = new DataWrapper(value)
      wrapper["update"] = (value) ->
        value
      update = spyOn(wrapper, "update")
      wrapper.get("a").get("b").set([100])

      expect(update).toHaveBeenCalled()

  describe "#getPath", ->
    describe "when data is a primitive", ->
      it "returns empty array", ->
        wrapper = new DataWrapper(1)

        expect(wrapper.getPath()).toEqual([])

    describe "when data is a hash", ->
      it "returns path to value", ->
        value = {}
        key = "foo"
        value[key] = "bar"
        wrapper = new DataWrapper(value)

        expect(wrapper.get(key).getPath()).toEqual([key])

    describe "when data is an array", ->
      it "returns path to value", ->
        value = [0, 1, 2, 3]
        wrapper = new DataWrapper(value)
        index = 0

        expect(wrapper.get(index).getPath()).toEqual([index])

    describe "when path is defined", ->
      describe "when data is nested", ->
        it "returns path of one key", ->
          value = {}
          key = "foo"
          value[key] = "bar"
          wrapper = new DataWrapper(value)

          # Child wrapper will yield path to navigate from top level data
          childWrapper = wrapper.wrappers[key]

          expect(childWrapper.getPath()).toEqual([key])

  describe "#getValue", ->
    it "returns input value", ->
      value = {key1: 1, key2: 2}
      wrapper = new DataWrapper(value)

      expect(wrapper.getValue()).toBe(value)
