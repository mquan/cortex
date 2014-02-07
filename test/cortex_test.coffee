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
      cortex.update({}, [])

      expect(called).toBe(true)

    it "sets value to new data", ->
      cortex = new Cortex(@value)
      newValue = {foo: "bar"}
      cortex.update(newValue, [])

      expect(cortex.getValue()).toEqual(newValue)

    it "sets value of a key", ->
      cortex = new Cortex(@value)
      newValue = 100
      cortex.update(newValue, [cortex.get("a").getPath()])

      expect(cortex.getValue()["a"]).toEqual(newValue)

    it "sets value of a nested object", ->
      cortex = new Cortex(@value)
      newValue = {nested: [100, 200, 300]}
      path = cortex.get("b").get("key2").get("key3").getPath()
      cortex.update(newValue, path)

      expect(cortex.getValue()["b"]["key2"]["key3"]).toEqual(newValue)

    it "sets value of an array element", ->
      cortex = new Cortex(@value)
      newValue = [0, 11, 22]
      path = cortex.get("c").getPath()
      cortex.update(newValue, path)

      expect(cortex.getValue()["c"]).toEqual(newValue)

    it "sets a primitive value in an array", ->
      cortex = new Cortex(@value)
      newValue = -1
      path = cortex.get("c").get(0).getPath()
      cortex.update(newValue, path)

      expect(cortex.getValue()["c"][0]).toEqual(newValue)

    describe "when new value change is nested", ->
      describe "when data is an array", ->
        describe "when elements are primitive", ->
          it "runs callback and rewraps new value", ->
            called = false
            value = [1, 2, 3]
            newValue = [1, 2, 4]
            cortex = new Cortex(value, (-> called = true))
            cortex.update(newValue, [])

            expect(called).toBe(true)
            for val, i in newValue
              expect(cortex.get(i).getValue()).toBe(val)

        describe "when elements are object", ->
          it "runs callback and rewraps new value", ->
            called = false
            value = [{a: 1}, {b: 2}]
            newValue = [{a: 1}, {c: 3}]
            cortex = new Cortex(value, (-> called = true))
            cortex.update(newValue, [])

            expect(called).toBe(true)
            expect(cortex.get(1).get("b")).toBe(undefined)
            expect(cortex.get(1).get("c").getValue()).toBe(3)

      describe "when data is a hash", ->
        describe "when hash values are primitive", ->
          it "runs callback and rewraps new value", ->
            called = false
            value = {a: 1, b: 2}
            newValue = {a: 1, b: 3}
            cortex = new Cortex(value, (-> called = true))
            cortex.update(newValue, [])

            expect(called).toBe(true)
            expect(cortex.get("b").getValue()).toBe(3)

        describe "when hash values are array", ->
          it "runs callback and rewraps new value", ->
            called = false
            value = {a: [1, 2], b: [3, 4]}
            newValue = {a: [1, 2], b: [3, 5]}
            cortex = new Cortex(value, (-> called = true))
            cortex.update(newValue, [])

            expect(called).toBe(true)
            expect(cortex.get("b").getValue()).toEqual([3, 5])

    describe "when new value is the same as old value", ->
      describe "when primitive value", ->
        describe "when data is at root level", ->
          it "does not run callback", ->
            called = false
            value = 1
            cortex = new Cortex(value, (-> called = true))
            cortex.update(value, [])

            expect(called).toBe(false)

        describe "when data is 1 level deep", ->
          it "does not run callback", ->
            called = false
            value = {a: 1}
            cortex = new Cortex(value, (-> called = true))
            cortex.update(1, ["a"])

            expect(called).toBe(false)

        describe "when data is 2 levels deep", ->
          it "does not run callback", ->
            called = false
            value = {a: {b: 1}}
            cortex = new Cortex(value, (-> called = true))
            cortex.update(1, ["a", "b"])

            expect(called).toBe(false)

      # Run same test for root, 1 level, and 2 levels deep because the internal logic are different.
      describe "when array", ->
        describe "when data is at root", ->
          describe "when array elements are primitive type", ->
            it "does not run callback", ->
              called = false
              value = [1, 2, 3]
              cortex = new Cortex(value, (-> called = true))
              cortex.update(value.slice(), [])

              expect(called).toBe(false)

          describe "when array elements are object", ->
            it "does not run callback", ->
              called = false
              value = [{a: 1}, {b: 2}]
              cortex = new Cortex(value, (-> called = true))
              cortex.update([{a: 1}, {b: 2}], [])

              expect(called).toBe(false)

        describe "when data is nested 1 level deep", ->
          it "does not run callback", ->
            called = false
            value = {arr: [1, 2, 3]}
            cortex = new Cortex(value, (-> called = true))
            cortex.update([1, 2, 3], ["arr"])

            expect(called).toBe(false)

        describe "when data is nested 2 levels deep", ->
          it "does not run callback", ->
            called = false
            value = {a: {b: [1, 2, 3]}}
            cortex = new Cortex(value, (-> called = true))
            cortex.update([1, 2, 3], ["a", "b"])

            expect(called).toBe(false)

      describe "when a hash", ->
        describe "when data is at root", ->
          describe "when hash values are primitive types", ->
            it "does not run callback", ->
              called = false
              value = {a: 1, b: 2, c: 3}
              # Change key order but should be the same hash
              cortex = new Cortex(value, (-> called = true))
              cortex.update({c: 3, b: 2, a: 1}, [])

              expect(called).toBe(false)

          describe "when hash values are objects", ->
            it "does not run callback", ->
              called = false
              value = {a: {aa: 1}, b: {bb: 2}}
              cortex = new Cortex(value, (-> called = true))
              cortex.update({a: {aa: 1}, b: {bb: 2}}, [])

              expect(called).toBe(false)

          describe "when hash values are arrays", ->
            it "does not run callback", ->
              called = false
              value = {a: [1, 2], b: [1, 2]}
              cortex = new Cortex(value, (-> called = true))
              cortex.update({a: [1, 2], b: [1, 2]}, [])

              expect(called).toBe(false)

