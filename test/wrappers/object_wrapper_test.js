var Cortex = require("../../src/cortex");

describe("ObjectWrapper", function() {
  beforeEach(function() {
    jasmine.clock().install();
    this.value = {a: 1, b: 2, c: 3};
    this.wrapper = new Cortex(this.value);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe("#keys", function() {
    it("returns an array of the keys", function() {
      expect(this.wrapper.keys()).toEqual(["a", "b", "c"]);
    });
  });

  describe("#values", function() {
    it("returns an array of the values", function() {
      expect(this.wrapper.values()).toEqual([1, 2, 3]);
    });
  });

  describe("#hasKey", function() {
    it("returns true when key exists", function() {
      expect(this.wrapper.hasKey("a")).toBe(true);
    });

    it("returns false when key does not exist", function() {
      expect(this.wrapper.hasKey("xyz")).toBe(false);
    });
  });

  describe("#remove", function() {
    describe("when key exists", function() {
      it("removes key value pair from object and updates wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.remove('a');

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.getValue()).toEqual({b: 2, c: 3});
        expect(updated.a).toBe(undefined);
        expect(cortex.a).not.toBe(undefined);
      });

      describe("when key is 0", function() {
        it("removes key value pair from object and updates wrapper", function() {
          let value = {0: 'foo', 1: 'bar'};
          var updated;
          var cortex = new Cortex(value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.remove(0);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.getValue()).toEqual({1: 'bar'});
          expect(updated[0]).toBe(undefined);
          expect(cortex[0]).not.toBe(undefined);
        });
      });
    });

    describe("when key does not exist", function() {
      it("does not update wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.remove('z');

        jasmine.clock().tick();

        expect(updated).toBe(undefined);
      });
    });
  });

  describe("#merge", function() {
    describe("when key does not exist", function() {
      it("adds key to wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.merge({d: 4});

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.getValue()).toEqual({a: 1, b: 2, c: 3, d: 4});
        expect(updated.d.getValue()).toEqual(4);

        expect(updated.a).toBe(cortex.a);
        expect(updated.b).toBe(cortex.b);
        expect(updated.c).toBe(cortex.c);
      });
    });

    describe("when key exists", function() {
      it("overwrites value of existing key", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.merge({c: 4});

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.getValue()).toEqual({a: 1, b: 2, c: 4});
        expect(updated.c.getValue()).toEqual(4);

        expect(updated.a).toBe(cortex.a);
        expect(updated.b).toBe(cortex.b);
      });
    });
  });
});
