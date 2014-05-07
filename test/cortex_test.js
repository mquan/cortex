var Cortex = require("../src/cortex");

describe("Cortex", function() {
  beforeEach(function() {
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
      c: [0, 1, 2]
    };
  });

  describe("#on", function() {
    describe("when update event", function() {
      it("sets new callback", function() {
        var called1 = null,
            called2 = null,
            cortex = new Cortex(this.value, function(updatedCortex) {
              called1 = updatedCortex.updatedValue.getValue();
            });

        cortex.on("update", function(updatedCortex) {
          called2 = updatedCortex.updatedValue.getValue();
        });

        cortex.update({updatedValue: 123}, []);

        expect(called1).toBe(cortex.updatedValue.getValue());
        expect(called2).toBe(cortex.updatedValue.getValue());
      });
    });

    describe("when not update event", function() {
      it("does not change callback", function() {
        var called1 = null,
            called2 = null,
            cortex = new Cortex(this.value, function(updatedCortex) {
              called1 = updatedCortex.updatedValue.getValue();
            });

        cortex.on("notupdate", function(updatedCortex) {
          called2 = updatedCortex.updatedValue.getValue();
        });

        cortex.update({updatedValue: 123}, []);

        expect(called1).toBe(cortex.updatedValue.getValue());
        expect(called2).toBe(null);
      });
    });
  });

  describe("#off", function() {
    describe("when update event", function() {
      describe("when no callback specified", function() {
        it("removes all callbacks", function() {
          var called1 = null,
            called2 = null,
            callback1 = function(updatedCortex) {
              called1 = updatedCortex.updatedValue.getValue();
            },
            callback2 = function(updatedCortex) {
              called2 = updatedCortex.updatedValue.getValue();
            },
            cortex = new Cortex(this.value, callback1);

          cortex.on("update", callback2);
          cortex.off("update");

          cortex.update({updatedValue: 123}, []);

          expect(called1).toBe(null);
          expect(called2).toBe(null);
        });
      });

      describe("when callback is specified", function() {
        it("removes specified callback", function() {
          var called1 = null,
            called2 = null,
            callback1 = function(updatedCortex) {
              called1 = updatedCortex.updatedValue.getValue();
            },
            callback2 = function(updatedCortex) {
              called2 = updatedCortex.updatedValue.getValue();
            },
            cortex = new Cortex(this.value, callback1);

          cortex.on("update", callback2);
          cortex.off("update", callback1);

          cortex.update({updatedValue: 123}, []);

          expect(called1).toBe(null);
          expect(called2).toBe(cortex.updatedValue.getValue());
        });
      });
    });

    describe("when not update event", function() {
      it("does not remove any callback", function() {
        var called1 = null,
            called2 = null,
            callback1 = function(updatedCortex) {
              called1 = updatedCortex.updatedValue.getValue();
            },
            callback2 = function(updatedCortex) {
              called2 = updatedCortex.updatedValue.getValue();
            },
            cortex = new Cortex(this.value, callback1);

        cortex.on("update", callback2);
        cortex.off("notupdate");

        cortex.update({updatedValue: 123}, []);

        expect(called1).toBe(cortex.updatedValue.getValue());
        expect(called2).toBe(cortex.updatedValue.getValue());
      });
    });
  });

  describe("#update", function() {
    it("runs callback", function() {
      var called = false,
          cortex = new Cortex(this.value, function() {
            called = true;
          });

      cortex.update({}, []);

      expect(called).toBe(true);
    });

    it("sets value to new data", function() {
      var cortex = new Cortex(this.value),
          newValue = { foo: "bar" };
      cortex.update(newValue, []);

      expect(cortex.getValue()).toEqual(newValue);
    });

    it("sets value of a key", function() {
      var cortex = new Cortex(this.value),
          newValue = 100;
      cortex.update(newValue, [cortex.a.getPath()]);

      expect(cortex.getValue()["a"]).toEqual(newValue);
    });

    it("sets value of a nested object", function() {
      var cortex = new Cortex(this.value),
          newValue = { nested: [100, 200, 300]},
          path = cortex.b.key2.key3.getPath();
      cortex.update(newValue, path);

      expect(cortex.getValue()["b"]["key2"]["key3"]).toEqual(newValue);
    });

    it("sets value of an array element", function() {
      var cortex = new Cortex(this.value),
          newValue = [0, 11, 22],
          path = cortex.c.getPath();
      cortex.update(newValue, path);

      expect(cortex.getValue()["c"]).toEqual(newValue);
    });

    it("sets a primitive value in an array", function() {
      var cortex = new Cortex(this.value),
          newValue = -1,
          path = cortex.c[0].getPath();
      cortex.update(newValue, path);

      expect(cortex.getValue()["c"][0]).toEqual(newValue);
    });

    describe("when new value change is nested", function() {
      describe("when data is an array", function() {
        describe("when elements are primitive", function() {
          it("runs callback and rewraps new value", function() {
            var called = false,
                value = [1, 2, 3],
                newValue = [1, 2, 4],
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update(newValue, []);

            expect(called).toBe(true);

            for (var i = 0, ii = newValue.length;i < ii;i++) {
              expect(cortex[i].getValue()).toBe(newValue[i]);
            }
          });
        });

        describe("when elements are object", function() {
          it("runs callback and rewraps new value", function() {
            var called = false,
              value = [{a: 1}, {b: 2}],
              newValue = [{a: 1}, {c: 3}],
              cortex = new Cortex(value, (function() {
                called = true;
              }));
            cortex.update(newValue, []);

            expect(called).toBe(true);
            expect(cortex[1].b).toBe(undefined);
            expect(cortex[1].c.getValue()).toBe(3);
            expect(cortex.getValue()).toBe(newValue);
          });
        });
      });

      describe("when data is a hash", function() {
        describe("when hash values are primitive", function() {
          it("runs callback and rewraps new value", function() {
            var called = false,
            value = {a: 1, b: 2},
            newValue = {a: 1, b: 3},
            cortex = new Cortex(value, (function() {
              called = true;
            }));

            cortex.update(newValue, []);
            expect(called).toBe(true);
            expect(cortex.b.getValue()).toBe(3);
          });
        });

        describe("when hash values are array", function() {
          it("runs callback and rewraps new value", function() {
            var called = false,
                value = { a: [1, 2], b: [3, 4] },
                newValue = { a: [1, 2], b: [3, 5] },
                cortex = new Cortex(value, (function() {
                  called = true;
                }));

            cortex.update(newValue, []);
            expect(called).toBe(true);
            expect(cortex.b.getValue()).toEqual([3, 5]);
          });
        });
      });
    });

    describe("when new value is the same as old value", function() {
      describe("when primitive value", function() {
        describe("when data is at root level", function() {
          it("does not run callback", function() {
            var called = false,
                value = 1,
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update(value, []);

            expect(called).toBe(false);
          });
        });

        describe("when data is 1 level deep", function() {
          it("does not run callback", function() {
            var called = false,
                value = { a: 1 },
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update(1, ["a"]);

            expect(called).toBe(false);
          });
        });

        describe("when data is 2 levels deep", function() {
          it("does not run callback", function() {
            var called = false,
                value = { a: { b: 1 } },
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update(1, ["a", "b"]);

            expect(called).toBe(false);
          });
        });
      });

      describe("when array", function() {
        describe("when data is at root", function() {
          describe("when array elements are primitive type", function() {
            it("does not run callback", function() {
              var called = false,
                  value = [1, 2, 3],
                  cortex = new Cortex(value, (function() {
                    called = true;
                  }));
              cortex.update(value.slice(), []);

              expect(called).toBe(false);
            });
          });

          describe("when array elements are object", function() {
            it("does not run callback", function() {
              var called = false,
                  value = [{a: 1}, {b: 2}],
                  cortex = new Cortex(value, (function() {
                    called = true;
                  }));
              cortex.update([{a: 1}, {b: 2}], []);

              expect(called).toBe(false);
            });
          });
        });

        describe("when data is nested 1 level deep", function() {
          it("does not run callback", function() {
            var called = false,
                value = {arr: [1, 2, 3]},
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update([1, 2, 3], ["arr"]);

            expect(called).toBe(false);
          });
        });

        describe("when data is nested 2 levels deep", function() {
          it("does not run callback", function() {
            var called = false,
                value = {a: { b: [1, 2, 3] } },
                cortex = new Cortex(value, (function() {
                  called = true;
                }));
            cortex.update([1, 2, 3], ["a", "b"]);

            expect(called).toBe(false);
          });
        });
      });

      describe("when a hash", function() {
        describe("when data is at root", function() {
          describe("when hash values are primitive types", function() {
            it("does not run callback", function() {
              var called = false,
                  value = {a: 1, b: 2, c: 3},
                  cortex = new Cortex(value, (function() {
                    called = true;
                  }));
              cortex.update({c: 3, b: 2, a: 1}, []);

              expect(called).toBe(false);
            });
          });

          describe("when hash values are objects", function() {
            it("does not run callback", function() {
              var called = false,
                  value = { a: { aa: 1}, b: { bb: 2 } },
                  cortex = new Cortex(value, (function() {
                    called = true;
                  }));

              cortex.update({a: {aa: 1}, b: { bb: 2 } }, []);

              expect(called).toBe(false);
            });
          });

          describe("when hash values are arrays", function() {
            it("does not run callback", function() {
              var called = false,
                  value = { a: [1, 2], b: [1, 2]},
                  cortex = new Cortex(value, (function() {
                    called = true;
                  }));
              cortex.update({ a: [1, 2], b: [1, 2] }, []);

              expect(called).toBe(false);
            });
          });
        });
      });
    });
  });

  describe("Update notification", function() {
    it("calls update method", function() {
      var cortex = new Cortex(1),
          update = spyOn(cortex, "update"),
          newValue = 100;
      //Call set to trigger update event
      cortex.set(newValue);

      expect(update).toHaveBeenCalledWith(newValue, cortex.getPath(), undefined);
    });
  });

  describe("Remove notification", function() {
    describe("when not a root", function() {
      describe("when parent is an array", function() {
        it("removes the specified element in parent array", function() {
          var value = [1, 2, 3, 4, 5],
              length = value.length,
              cortex = new Cortex(value);

          cortex[0].remove();

          expect(cortex.count()).toBe(length - 1);
          expect(cortex[0].getValue()).toBe(2);
        });
      });

      describe("when parent is a hash", function() {
        it("removes the specified key and value pair", function() {
          var value = { a: 1, b: 2, c: 3 },
              cortex = new Cortex(value);

          cortex.a.remove();

          expect(cortex.a).toBe(undefined);
          expect(cortex.hasKey("a")).toBe(false);
        });
      });
    });

    describe("when a root", function() {
      it("removes itself", function() {
        var cortex = new Cortex(1);
        cortex.remove();

        expect(cortex.getValue()).toBe(undefined);
      });
    });
  });
});
