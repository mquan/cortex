var Cortex = require("../../src/cortex");

describe("ArrayWrapper", function() {
  beforeEach(function() {
    this.value = [1, 1, 2, 3, 5, 8, 13];
    this.wrapper = new Cortex(this.value);
  });

  describe("#count", function() {
    it("returns length of nested wrappers", function() {
      expect(this.wrapper.count()).toBe(this.value.length);
    });
  });

  describe("#map", function() {
    it("returns a new array with elements as results returned from function", function() {
      var out = this.wrapper.map(function(obj) {
        return obj.getValue() * 2;
      });

      expect(out).toEqual(this.value.map(function(v) {
        return v * 2;
      }));
    });
  });

  describe("#find", function() {
    it("returns wrapper element that matches condition of input function", function() {
      var value = this.value[this.value.length - 1],
          out = this.wrapper.find(function(obj) {
            return obj.getValue() === value;
          });

      expect(out.getValue()).toBe(value);
    });

    it("returns null when does not meet condition", function() {
      var out = this.wrapper.find(function(obj) {
        return false;
      });

      expect(out).toBe(null);
    });
  });

  describe("#findIndex", function() {
    it("returns index of value when value exists in array", function() {
      var index = Math.floor(this.value.length / 2),
          value = this.value[index],
          out = this.wrapper.findIndex(function(elem, i, arr) {
            return elem.getValue() === value;
          });

      expect(out).toBe(index);
    });

    it("returns -1 when not found", function() {
      var out = this.wrapper.findIndex(function(elem, i, arr) {
        return false;
      });

      expect(out).toBe(-1);
    });

    it("returns -1 when value does not exist in array", function() {
      var someValue = 1000,
          out = this.wrapper.findIndex(function(elem, i, arr) {
            return elem.getValue() === someValue;
          });

      expect(out).toBe(-1);
    });
  });

  describe("#push", function() {
    it("inserts a new wrapper with value at the end", function() {
      var length = this.value.length,
          value = this.value[this.value.length - 1] + this.value[this.value.length - 2],
          newLength = this.wrapper.push(value);

      expect(newLength).toBe(length + 1);
      expect(this.wrapper.count()).toBe(length + 1);
      expect(this.wrapper[length].getValue()).toBe(value);
    });
  });

  describe("#pop", function() {
    it("removes the last element in the array", function() {
      var currentLength = this.value.length,
          value = this.value[currentLength - 1],
          removed = this.wrapper.pop();

      expect(removed).toBe(value);
      expect(this.wrapper.count()).toBe(currentLength - 1);
    });
  });

  describe("#unshift", function() {
    it("inserts a new wrapper with value at the beginning", function() {
      var reversed = this.value.reverse(),
          length = reversed.length,
          value = reversed[0] + reversed[1],
          newLength = this.wrapper.unshift(value);

      expect(newLength).toBe(length + 1);
      expect(this.wrapper.count()).toBe(length + 1);
      expect(this.wrapper[0].getValue()).toBe(value);
    });
  });

  describe("#shift", function() {
    it("removes the first element in the array", function() {
      var currentLength = this.value.length,
          value = this.value[0],
          removed = this.wrapper.shift();

      expect(removed).toBe(value);
      expect(this.wrapper.count()).toBe(currentLength - 1);
    });
  });

  describe("#insertAt", function() {
    describe("when insert value is not an array", function() {
      it("inserts a wrapper with value at specified index", function() {
        var insertValue = 55,
            currentLength = this.value.length,
            index = Math.floor(currentLength / 2);
        this.wrapper.insertAt(index, insertValue);

        expect(this.wrapper.count()).toBe(currentLength + 1);
        expect(this.wrapper[index].getValue()).toBe(insertValue);
      });
    });

    describe("when insert value is an array", function() {
      it("inserts nested wrappers with values starting at specified index", function() {
        var insertArray = [0, 1],
            currentLength = this.value.length,
            index = Math.floor(currentLength / 2),
            newArray = this.value.slice(0);
        Array.prototype.splice.apply(newArray, [index, 0].concat(insertArray));
        this.wrapper.insertAt(index, insertArray);

        expect(this.wrapper.count()).toBe(currentLength + insertArray.length);
        this.wrapper.forEach(function(wrapperElement, i) {
          expect(wrapperElement.getValue()).toBe(newArray[i]);
        });
      });
    });
  });

  describe("#removeAt", function() {
    it("removes input number of element starting at index", function() {
      var currentLength = this.value.length,
          index = Math.floor(currentLength / 2),
          howMany = 2,
          newArray = this.value.slice(0),
          expectedRemoved = newArray.splice(index, howMany),
          removed = this.wrapper.removeAt(index, howMany);

      expect(removed).toEqual(expectedRemoved);
      expect(this.wrapper.count()).toBe(currentLength - howMany);
      this.wrapper.forEach(function(wrapperElement, i) {
        expect(wrapperElement.getValue()).toBe(newArray[i]);
      });
    });

    it("fails when called on a non array", function() {
      this.wrapper = new Cortex(1);

      expect(this.wrapper.removeAt.bind(0)).toThrow();
    });
  });
});
