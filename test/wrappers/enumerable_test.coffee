# Use Cortex model for testing because we don't want to stub update method.
Cortex = require("../../src/cortex")

describe "Enumerable", ->
  beforeEach ->
    @value = [1, 1, 2, 3, 5, 8, 13]
    @wrapper = new Cortex(@value)

  describe "#count", ->
    it "returns length of nested wrappers", ->
      expect(@wrapper.count()).toBe(@value.length)

  describe "#forEach", ->
    describe "when array", ->
      it "iterates over all elements of wrapper array", ->
        out = []
        @wrapper.forEach (obj) ->
          out.push(obj.getValue())

        expect(out).toEqual(@value)

    describe "when an object", ->
      it "iterates over every key and element pair in the object", ->
        value = {a: 1, b: 2, c: 3}
        wrapper = new Cortex(value)

        out = []
        wrapper.forEach (key, wrapper) ->
          out.push("#{key}:#{wrapper.getValue()}")

        expect(out).toEqual(["a:1", "b:2", "c:3"])

  describe "#map", ->
    it "returns a new array with elements as results returned from function", ->
      out = @wrapper.map (obj) ->
        obj.getValue() * 2

      expect(out).toEqual(@value.map( (v) -> v * 2))

  describe "#find", ->
    it "returns wrapper element that matches condition of input function", ->
      value = @value[@value.length-1]
      out = @wrapper.find (obj) ->
        obj.getValue() == value

      expect(out.getValue()).toBe(value)

    it "returns null when does not meet condition", ->
      out = @wrapper.find (obj) ->
        false

      expect(out).toBe(null)

  describe "#findIndex", ->
    it "returns index of value when value exists in array", ->
      index = Math.floor(@value.length / 2)
      value = @value[index]
      out = @wrapper.findIndex (elem, i, arr) ->
        elem.getValue() == value

      expect(out).toBe(index)

    it "returns -1 when not found", ->
      out = @wrapper.findIndex (elem, i, arr) ->
        false

      expect(out).toBe(-1)

    it "returns -1 when value does not exist in array", ->
      someValue = 1000
      out = @wrapper.findIndex (elem, i, arr) ->
        elem.getValue() == someValue

      expect(out).toBe(-1)

  describe "#push", ->
    it "inserts a new wrapper with value at the end", ->
      length = @value.length
      value = @value[@value.length-1] + @value[@value.length-2]

      newLength = @wrapper.push(value)

      # Check that push return the length.
      expect(newLength).toBe(length + 1)
      expect(@wrapper.count()).toBe(length + 1)
      expect(@wrapper.get(length).getValue()).toBe(value)

  describe "#pop", ->
    it "removes the last element in the array", ->
      currentLength = @value.length
      value = @value[currentLength-1]

      removed = @wrapper.pop()

      expect(removed).toBe(value)
      expect(@wrapper.count()).toBe(currentLength - 1)

  describe "#insertAt", ->
    describe "when insert value is not an array", ->
      it "inserts a wrapper with value at specified index", ->
        insertValue = 55
        currentLength = @value.length
        index = Math.floor(currentLength / 2)
        @wrapper.insertAt(index, insertValue)

        expect(@wrapper.count()).toBe(currentLength + 1)
        expect(@wrapper.get(index).getValue()).toBe(insertValue)

    describe "when insert value is an array", ->
      it "inserts nested wrappers with values starting at specified index", ->
        insertArray = [0, 1]
        currentLength = @value.length
        index = Math.floor(currentLength / 2)

        # Compute expected new array before inserting
        newArray = @value.slice(0)
        Array.prototype.splice.apply(newArray, [index, 0].concat(insertArray))

        @wrapper.insertAt(index, insertArray)

        expect(@wrapper.count()).toBe(currentLength + insertArray.length)

        @wrapper.forEach (wrapperElement, i) ->
          expect(wrapperElement.getValue()).toBe(newArray[i])

  describe "#removeAt", ->
    it "removes input number of element starting at index", ->
      currentLength = @value.length
      index = Math.floor(currentLength / 2)
      howMany = 2

      newArray = @value.slice(0)
      expectedRemoved = newArray.splice(index, howMany)

      removed = @wrapper.removeAt(index, howMany)

      expect(removed).toEqual(expectedRemoved)
      expect(@wrapper.count()).toBe(currentLength - howMany)
      @wrapper.forEach (wrapperElement, i) ->
        expect(wrapperElement.getValue()).toBe(newArray[i])

    it "fails when called on a non-object", ->
      @wrapper = new Cortex(1)
      expect(@wrapper.removeAt.bind(0)).toThrow()

  describe "#delete", ->
    describe "when parent is a hash", ->
      beforeEach ->
        @wrapper = new Cortex({"foo": "bar", "baz": "bort"})

      it "deletes the correct child", ->
        @wrapper.get("foo").delete()
        expect(@wrapper.get("foo")).toBe(undefined)
        expect(@wrapper.get("baz").getValue()).toBe("bort")
 
    describe "when parent is an array", ->
      beforeEach ->
        @wrapper = new Cortex([1,2,3])

      it "deletes the correct child", ->
        value = @wrapper.get(0)
        value.delete()
        expect(@wrapper.get(0).getValue()).toBe(2)
        expect(@wrapper.get(1).getValue()).toBe(3)
        expect(@wrapper.count()).toBe(2)

    describe "when root", ->
      beforeEach ->
        @wrapper = new Cortex(1)
        
      it "does nothing to itself", ->
        @wrapper.delete()
        expect(@wrapper.getValue()).toEqual(1)

