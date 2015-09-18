var Cortex = require("../src/cortex");

describe("Cortex", function() {
  beforeEach(function() {
    jasmine.clock().install();

    this.value = {
      a: 1,
      b: {
        key1: "hello",
        key2: {
          key3: {
            nested: [1, 2, 3]
          }
        }
      },
      c: [0, 1, 2],
      d: { foo: 1, bar: { a: 1, b: 2} }
    };
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  describe("updating data", function() {
    fdescribe("running callback", function() {
      it("runs callback", function() {
        var called = false;
        var cortex = new Cortex(this.value, function() {
          called = true;
        });

        cortex.set({});

        jasmine.clock().tick();

        expect(called).toBe(true);
      });

      it("runs callback once for multiple updates", function() {
        var called = 0,
            cortex = new Cortex(this.value, function() {
              called += 1;
            });

        cortex.a.set(2);
        cortex.c[0].set(10);

        jasmine.clock().tick();

        expect(called).toBe(1);
      });

      it("queues update inside a callback", function() {
        var called = 0,
            updated,
            cortex = new Cortex(this.value, function(updatedCortex) {
              updated = updatedCortex;
              updated.set({calledFrom: "callback"});
              called += 1;
            });

        cortex.set({calledFrom: "outside"});

        jasmine.clock().tick();

        expect(called).toBe(1);
        expect(updated.getValue()).toEqual({calledFrom: "outside"});
      });
    });

    describe("setting value", function() {
      describe("when there is no change", function() {
        it("does not create new cortex object", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.set(this.value);

          jasmine.clock().tick();
          expect(updated).toBe(undefined);
        });
      });

      describe("when setting value of root node to primitive", function() {
        it("updates value and returns a new cortex object", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.set(1);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.getValue()).toEqual(1);
        });
      });

      describe("when setting value of root to an array", function() {
        it("updates value and returns new cortex object", function() {
          var updated;
          var value = [],
              newValue = [1, 2, 3];
          var cortex = new Cortex(value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.set(newValue);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.getValue()).toEqual(newValue);

          for(var i = 0, ii = newValue.length; i < ii; i++) {
            expect(updated[i].getValue()).toEqual(newValue[i]);
          }
        });
      });

      describe("when setting value of root to an object", function() {
        it("updates value and returns new cortex object", function() {
          var updated;
          var value = {},
              newValue = {a: 1, b: 2};
          var cortex = new Cortex(value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.set(newValue);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.getValue()).toEqual(newValue);

          for(var key in newValue) {
            expect(updated[key].getValue()).toEqual(newValue[key]);
          }
        });
      });

      describe("when setting value of a nested object", function() {
        it("updates value and returns a new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.a.set(100);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.a).not.toBe(cortex.a);
          expect(updated.b).toBe(cortex.b);
          expect(updated.c).toBe(cortex.c);
          expect(updated.d).toBe(cortex.d);

          this.value.a = 100;
          expect(updated.getValue()).toEqual(this.value);
          expect(updated.a.getValue()).toEqual(this.value.a);
        });
      });

      describe("when setting value of an element in array", function() {
        it("updates value and returns a new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.c[1].set(100);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.c).not.toBe(cortex.c);
          expect(updated.c[1]).not.toBe(cortex.c[1]);
          expect(updated.c[0]).toBe(cortex.c[0]);
          expect(updated.c[2]).toBe(cortex.c[2]);
          expect(updated.a).toBe(cortex.a);
          expect(updated.b).toBe(cortex.b);
          expect(updated.d).toBe(cortex.d);

          this.value.c[1] = 100;
          expect(updated.getValue()).toEqual(this.value);
          expect(updated.c.getValue()).toEqual(this.value.c);
          expect(updated.c[1].getValue()).toEqual(this.value.c[1]);
        });
      });

      describe("when setting value of object", function() {
        it("updates value and returns a new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          cortex.d.bar.set({b: 2, c: 3});

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.d).not.toBe(cortex.d);
          expect(updated.d.bar).not.toBe(cortex.d.bar);
          expect(updated.d.bar.a).toBe(undefined);
          expect(updated.d.bar.b).toBe(cortex.d.bar.b);
          expect(updated.d.bar.c).not.toBe(undefined);
          expect(updated.a).toBe(cortex.a);
          expect(updated.b).toBe(cortex.b);
          expect(updated.c).toBe(cortex.c);

          this.value.d.bar = {b: 2, c: 3};
          expect(updated.getValue()).toEqual(this.value);
          expect(updated.d.getValue()).toEqual(this.value.d);
          expect(updated.d.bar.getValue()).toEqual(this.value.d.bar);
          expect(updated.d.foo.getValue()).toEqual(this.value.d.foo);
        })
      });

      describe("when setting value of very deeply nested object", function() {
        it("updates value and returns a new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value = [10, 20, 30];
          cortex.b.key2.key3.nested.set(value);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.b).not.toBe(cortex.b);
          expect(updated.b.key2).not.toBe(cortex.b.key2);
          expect(updated.b.key2.key3).not.toBe(cortex.b.key2.key3);
          expect(updated.b.key2.key3.nested).not.toBe(cortex.b.key2.key3.nested);
          expect(updated.a).toBe(cortex.a);
          expect(updated.c).toBe(cortex.c);
          expect(updated.d).toBe(cortex.d);

          this.value.b.key2.key3.nested = value;
          expect(updated.getValue()).toEqual(this.value);
          expect(updated.b.getValue()).toEqual(this.value.b);
          expect(updated.b.key2.getValue()).toEqual(this.value.b.key2);
          expect(updated.b.key2.key3.getValue()).toEqual(this.value.b.key2.key3);
          expect(updated.b.key2.key3.nested.getValue()).toEqual([10, 20, 30]);
        });
      });

      describe("when changing an array to object", function() {
        it("updates value and returns new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value = {a: 1};
          cortex.c.set(value);

          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.c).not.toBe(cortex.c);
          expect(updated.a).toBe(cortex.a);
          expect(updated.b).toBe(cortex.b);
          expect(updated.d).toBe(cortex.d);

          this.value.c = value;
          expect(updated.getValue()).toEqual(this.value);
          expect(updated.c.getValue()).toEqual(this.value.c);
        });
      });

      describe("when changing an object to an array", function() {
        it("updates value and returns new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value = [0, 1, 2];
          cortex.d.set(value);
          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.d).not.toBe(cortex.d);
          expect(updated.a).toBe(cortex.a);
          expect(updated.b).toBe(cortex.b);
          expect(updated.c).toBe(cortex.c);
          this.value.d = value;

          expect(updated.getValue()).toEqual(this.value);
          expect(updated.d.getValue()).toEqual(this.value.d);
        });
      });

      describe("deleting an element in object", function() {
        it("updates value and creates new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value = {foo: 1};
          cortex.d.set(value);
          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.d).not.toBe(cortex.d);
          expect(updated.d.foo).toBe(cortex.d.foo);
          expect(updated.d.bar).toBe(undefined);
          expect(cortex.d.bar).not.toBe(undefined); // show that this is not touched

          this.value.d = value;

          expect(updated.getValue()).toEqual(this.value);
          expect(updated.d.getValue()).toEqual(this.value.d);
        });
      });

      describe("deleting elements in array", function() {
        it("updates value and creates new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value = [0];
          cortex.c.set(value);
          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.c).not.toBe(cortex.c);
          expect(updated.c[0]).toBe(cortex.c[0]);
          expect(updated.c[1]).toBe(undefined);
          expect(updated.c[2]).toBe(undefined);
          expect(cortex.c[1]).not.toBe(undefined);
          expect(cortex.c[2]).not.toBe(undefined);

          this.value.c = value;

          expect(updated.getValue()).toEqual(this.value);
          expect(updated.c.getValue()).toEqual(this.value.c);
        });
      });

      describe("deleting elements in array in 2 steps", function() {
        it("updates value and creates new wrapper for every affected node", function() {
          var updated;
          var cortex = new Cortex(this.value, function(updatedCortex) {
            updated = updatedCortex;
          });
          var value1 = [0, 1],
              value2 = [0];
          cortex.c.set(value1);
          cortex.c.set(value2);
          jasmine.clock().tick();

          expect(updated).not.toBe(cortex);
          expect(updated.c).not.toBe(cortex.c);
          expect(updated.c[0]).toBe(cortex.c[0]);
          expect(updated.c[1]).toBe(undefined);
          expect(updated.c[2]).toBe(undefined);
          expect(cortex.c[1]).not.toBe(undefined);
          expect(cortex.c[2]).not.toBe(undefined);

          this.value.c = value2;

          expect(updated.getValue()).toEqual(this.value);
          expect(updated.c.getValue()).toEqual(this.value.c);
        })
      });
    });
  });

  describe("#destroy", function() {
    fdescribe("when deleting root node", function() {
      it("returns for wrapper for undefined", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.destroy();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.getValue()).toBe(undefined);
        expect(updated.a).toBe(undefined);
        expect(updated.b).toBe(undefined);
        expect(updated.c).toBe(undefined);
        expect(updated.d).toBe(undefined);
      });
    });

    describe("when deleting an object", function() {
      it("deletes and updates wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.d.destroy();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.d).toBe(undefined);
        expect(updated.a).toBe(cortex.a);
        expect(updated.b).toBe(cortex.b);
        expect(updated.c).toBe(cortex.c);
      });
    });

    describe("when deleting a key in object", function() {
      it("deletes and updates wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.a.destroy();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.a).toBe(undefined);
        expect(updated.b).toBe(cortex.b);
        expect(updated.c).toBe(cortex.c);
        expect(updated.d).toBe(cortex.d);
      });
    });

    describe("when deleting an array", function() {
      it("deletes and updates wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.c.destroy();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.getValue().c).toBe(undefined);
        expect(updated.c).toBe(undefined);
        expect(updated.a).toBe(cortex.a);
        expect(updated.b).toBe(cortex.b);
        expect(updated.d).toBe(cortex.d);
      });
    });

    describe("when deleting an element in array", function() {
      it("deletes and updates wrapper", function() {
        var updated;
        var cortex = new Cortex(this.value, function(updatedCortex) {
          updated = updatedCortex;
        });
        cortex.c[2].destroy();

        jasmine.clock().tick();

        expect(updated).not.toBe(cortex);
        expect(updated.c).not.toBe(cortex.c);
        expect(updated.c[0]).toBe(cortex.c[0]);
        expect(updated.c[1]).toBe(cortex.c[1]);

        expect(updated.getValue().c).toBe([0, 1]);
        expect(updated.getValue()).toBe([0, 1]);
        expect(updated.a).toBe(cortex.a);
        expect(updated.b).toBe(cortex.b);
        expect(updated.d).toBe(cortex.d);
      });
    });
  });
});