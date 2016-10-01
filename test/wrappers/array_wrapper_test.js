var Cortex = require("../../src/cortex");

describe("ArrayWrapper", function() {
  beforeEach(function() {
    jasmine.clock().install();

    this.value = [1, 1, 2, 3, 5, 8, 13];
    this.wrapper = new Cortex(this.value);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
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

  describe("#filter", function() {
    it("creates a new array whose elements satisfy condition in callback", function() {
      var out = this.wrapper.filter(function(elem) {
        return elem.getValue() % 2 === 0;
      });

      expect(out).toEqual([this.wrapper[2], this.wrapper[5]]);
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

      expect(out).toBe(undefined);
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
    describe("when pushing without argument", function() {
      it("does not update", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.push();

        jasmine.clock().tick();

        expect(updated).toBe(undefined);
        expect(cortex.getValue()).toEqual(this.value);
      });
    });

    describe("when pushing one element", function() {
      it("updates value and returns a new wrapper for every affected node", function() {
        var updated;
        var length = this.value.length;
        var elem = 21;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.push(elem);

        jasmine.clock().tick();

        var newValue = this.value.slice()
        newValue.push(elem);

        expect(updated).not.toBe(cortex);

        for(var i = 0, ii = length; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i]);
        }

        expect(updated.count()).toEqual(length + 1);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[length].getValue()).toEqual(elem);
      });
    });

    describe("when pushing multiple elements", function() {
      it("adds elements and returns a new wrapper for every affected node", function() {
        var updated;
        var length = this.value.length;
        var elem1 = 21, elem2 = 34;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.push(elem1);
        cortex.push(elem2);

        jasmine.clock().tick();

        var newValue = this.value.slice()
        newValue.push(elem1);
        newValue.push(elem2)

        expect(updated).not.toBe(cortex);

        for(var i = 0, ii = length; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i]);
        }

        expect(updated.count()).toEqual(length + 2);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[length].getValue()).toEqual(elem1);
        expect(updated[length + 1].getValue()).toEqual(elem2);
      });
    });

    describe("when pushing multiple elements in one call", function() {
      it("adds elements and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        var elem1 = 21, elem2 = 34;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.push(elem1, elem2);

        jasmine.clock().tick();

        var newValue = this.value.slice()
        newValue.push(elem1, elem2);

        expect(updated).not.toBe(cortex);

        for(var i = 0, ii = length; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i]);
        }

        expect(updated.count()).toEqual(length + 2);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[length].getValue()).toEqual(elem1);
        expect(updated[length + 1].getValue()).toEqual(elem2);
      });
    });
  });

  describe("#pop", function() {
    describe("when pop once", function() {
      it("updates the last element and returns new wrapper for each affected node", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.pop();

        jasmine.clock().tick();

        var newValue = this.value.slice();
        newValue.pop();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length - 1);
        expect(updated[length - 1]).not.toBe(cortex[length - 1]);
        expect(updated[length - 1]).toBe(undefined);

        for(var i = 0, ii = length - 1; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i]);
          expect(updated[i].getValue()).toEqual(cortex[i].getValue());
        }

        expect(updated.getValue()).toEqual(newValue);
      });
    });

    describe("when pop multiple times", function() {
      it("removes last elements and returns new wrapper for each affected node", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.pop();
        cortex.pop();

        jasmine.clock().tick();

        var newValue = this.value.slice();
        newValue.pop();
        newValue.pop();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length - 2);
        expect(updated[length - 1]).not.toBe(cortex[length - 1]);
        expect(updated[length - 1]).toBe(undefined);
        expect(updated[length - 2]).not.toBe(cortex[length - 2]);
        expect(updated[length - 2]).toBe(undefined);

        for(var i = 0, ii = length - 2; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i]);
          expect(updated[i].getValue()).toEqual(cortex[i].getValue());
        }

        expect(updated.getValue()).toEqual(newValue);
      });
    });
  });

  describe("#unshift", function() {
    describe("when unshift without argument", function() {
      it("does not update", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.unshift();

        jasmine.clock().tick();

        expect(updated).toBe(undefined);
        expect(cortex.getValue()).toEqual(this.value);
      });
    });

    describe("when unshift one element", function() {
      it("adds element to beginning of array and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.unshift('a');

        jasmine.clock().tick();

        var newValue = this.value.slice();
        newValue.unshift('a');

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length + 1);
        expect(updated[0].getValue()).toEqual(newValue[0]);

        for(var i = 1, ii = length + 1; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i - 1]);
          expect(updated[i].getValue()).toEqual(cortex[i - 1].getValue());
        }
      });
    });

    describe("when unshift multiple elements", function() {
      it("adds elements to beginning of array and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.unshift('a', 'b');

        jasmine.clock().tick();

        var newValue = this.value.slice();
        newValue.unshift('a', 'b');

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length + 2);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[0].getValue()).toEqual(newValue[0]);
        expect(updated[1].getValue()).toEqual(newValue[1]);

        for(var i = 2, ii = length + 2; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i - 2]);
          expect(updated[i].getValue()).toEqual(cortex[i - 2].getValue());
        }
      });
    });

    describe("when unshift multiple times", function() {
      it("adds elements to beginning of array and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.unshift('a');
        cortex.unshift('b', 'c');

        jasmine.clock().tick();

        var newValue = this.value.slice();
        newValue.unshift('a');
        newValue.unshift('b', 'c');

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length + 3);
        expect(updated[0].getValue()).toEqual(newValue[0]);
        expect(updated[1].getValue()).toEqual(newValue[1]);
        expect(updated[2].getValue()).toEqual(newValue[2]);

        for(var i = 3, ii = length + 3; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i - 3]);
          expect(updated[i].getValue()).toEqual(cortex[i - 3].getValue());
        }
      });
    });

    describe('when deeply nested object', function() {
      it('adds element to beginning of array and updates wrapper including children paths', function() {
        var value = [{a: 1}, {b: {c: 2}}]
        var length = value.length;
        var updated;
        var cortex = new Cortex(value, function(updatedCortex) {
          updated = updatedCortex;
        })
        var newElem = {d: 3};
        cortex.unshift(newElem);

        jasmine.clock().tick();

        var newValue = value.slice();
        newValue.unshift(newElem);

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toEqual(length + 1);
        expect(updated[0].getValue()).toEqual(newElem);
        expect(updated[0].getPath()).toEqual([0]);

        expect(updated[1].getValue()).toEqual({a: 1});
        expect(updated[1].getPath()).toEqual([1]);
        expect(updated[1].a.getPath()).toEqual([1, 'a']);

        expect(updated[2].getValue()).toEqual({b: {c: 2}})
        expect(updated[2].getPath()).toEqual([2]);
        expect(updated[2].b.getPath()).toEqual([2, 'b']);
        expect(updated[2].b.c.getPath()).toEqual([2, 'b', 'c']);
      })
    })
  });

  describe("#shift", function() {
    describe("when shift once", function() {
      it("removes the first element and updates wrapper", function() {
        var updated;
        var value = [{a: 1}, {b: 2}, {c: { d: 3}}];
        var length = value.length;
        var cortex = new Cortex(value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.shift();

        var newValue = value.slice();
        newValue.shift();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length - 1);
        expect(updated.getValue()).toEqual(newValue);

        for(var i = 0, ii = length - 1; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i + 1]);
          expect(updated[i].getValue()).toEqual(cortex[i + 1].getValue());
        }

        expect(updated[0].getPath()).toEqual([0])
        expect(updated[0].b.getPath()).toEqual([0, 'b'])
        expect(updated[1].getPath()).toEqual([1])
        expect(updated[1].c.getPath()).toEqual([1, 'c'])
        expect(updated[1].c.d.getPath()).toEqual([1, 'c', 'd'])
      });
    });

    describe("when shift multiple times", function() {
      it("removes elements at the beginning and updates wrapper", function() {
        var updated;
        var value = [{a: 1}, {b: 2}, {c: { d: 3}}];
        var length = value.length;
        var cortex = new Cortex(value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.shift();
        cortex.shift();

        var newValue = value.slice();
        newValue.shift();
        newValue.shift();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length - 2);
        expect(updated.getValue()).toEqual(newValue);

        for(var i = 0, ii = length - 2; i < ii; i++) {
          expect(updated[i]).toBe(cortex[i + 2]);
          expect(updated[i].getValue()).toEqual(cortex[i + 2].getValue());
        }

        expect(updated[0].getPath()).toEqual([0])
        expect(updated[0].c.getPath()).toEqual([0, 'c'])
        expect(updated[0].c.d.getPath()).toEqual([0, 'c', 'd'])
      });
    });
  });

  describe("#splice", function() {
    describe("when removing an element", function() {
      it("removes element and updates wrapper", function() {
        var updated;
        var value = [{a: 1}, {b: 2}, {c: { d: 3}}];
        var length = value.length;
        var index = 1;
        var cortex = new Cortex(value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 1);

        var newValue = value.slice();
        newValue.splice(index, 1);

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length - 1);
        expect(updated.getValue()).toEqual(newValue);

        // does not remove the old wrapper
        expect(cortex[index]).not.toBe(undefined);

        expect(updated[0].getPath()).toEqual([0])
        expect(updated[0].a.getPath()).toEqual([0, 'a'])
        expect(updated[1].getPath()).toEqual([1])
        expect(updated[1].c.getPath()).toEqual([1, 'c'])
        expect(updated[1].c.d.getPath()).toEqual([1, 'c', 'd'])
      });
    });

    describe("when remove multiple times", function() {
      it("removes elements and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        var index = 1;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 1);
        cortex.splice(index, 2);

        var newValue = this.value.slice();
        newValue.splice(index, 1);
        newValue.splice(index, 2);

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length - 3);
        expect(updated.getValue()).toEqual(newValue);

        expect(cortex[index]).not.toBe(undefined);
        expect(cortex[index + 1]).not.toBe(undefined);
        expect(cortex[index + 2]).not.toBe(undefined);
      });
    });

    describe("when remove and insert in one call", function() {
      it("removes elements and insert new ones", function() {
        var updated;
        var length = this.value.length;
        var index = 1;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 2, 'a', 'b');

        var newValue = this.value.slice();
        newValue.splice(index, 2, 'a', 'b');

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[index].getValue()).toBe('a');
        expect(updated[index + 1].getValue()).toBe('b');
      });
    });

    describe("when inserting one element without removing", function() {
      it("adds element at index position and updates wrapper", function() {
        var updated;
        var value = [{a: 1}, {c: { d: 3}}];
        var length = value.length;
        let index = 1,
            elem = {e: 4};
        var cortex = new Cortex(value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 0, elem);

        var newValue = value.slice();
        newValue.splice(index, 0, elem);

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length + 1);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[index].getValue()).toEqual(elem);

        expect(updated[0].getPath()).toEqual([0]);
        expect(updated[0].a.getPath()).toEqual([0, 'a']);
        expect(updated[1].getPath()).toEqual([1]);
        expect(updated[1].e.getPath()).toEqual([1, 'e']);
        expect(updated[2].getPath()).toEqual([2]);
        expect(updated[2].c.getPath()).toEqual([2, 'c']);
        expect(updated[2].c.d.getPath()).toEqual([2, 'c', 'd']);
      });
    });

    describe("when inserting multiple elements", function() {
      it("adds elements at index position and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        let index = 3,
            elem1 = 'a', elem2 = 'b';
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 0, elem1, elem2);

        var newValue = this.value.slice();
        newValue.splice(index, 0, elem1, elem2);

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length + 2);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[index].getValue()).toEqual(elem1);
        expect(updated[index + 1].getValue()).toEqual(elem2);
      });
    });

    describe("when inserting multiple times", function() {
      it("adds elements at index position and updates wrapper", function() {
        var updated;
        var length = this.value.length;
        let index = 3,
            elem1 = 'a', elem2 = 'b';
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.splice(index, 0, elem1);
        cortex.splice(index, 0, elem2);

        var newValue = this.value.slice();
        newValue.splice(index, 0, elem1);
        newValue.splice(index, 0, elem2);

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.count()).toBe(length + 2);
        expect(updated.getValue()).toEqual(newValue);
        expect(updated[index].getValue()).toEqual(elem2);
        expect(updated[index + 1].getValue()).toEqual(elem1);
      });
    });
  });
});