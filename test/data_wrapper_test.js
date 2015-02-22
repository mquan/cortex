var cortexPubSub = require("../src/pubsub"),
    DataWrapper = require("../src/data_wrapper")(cortexPubSub);

describe("DataWrapper", function() {
  describe("accessing nested wrapper", function() {
    describe("when data is a hash", function() {
      beforeEach(function() {
        this.value = {};
        this.key = "foo";
        this.val = "bar";
        this.value[this.key] = this.val;

        this.wrapper = new DataWrapper({value: this.value});
      });

      it("returns wrapper of nested value", function() {
        var nestedWrapper = this.wrapper[this.key];

        expect(nestedWrapper.getValue()).toBe(this.val);
      });

      it("returns undefined when key is not defined", function() {
        expect(this.wrapper.randomKey).toBe(undefined);
      });
    });

    describe("when data is an array", function() {
      beforeEach(function() {
        this.value = [1, 2, 3];

        this.wrapper = new DataWrapper({value: this.value});
      });

      it("returns wrapper of an array element", function() {
        var index = 1,
            nestedWrapper = this.wrapper[index];

        expect(nestedWrapper.getValue()).toBe(this.value[index]);
      });

      it("returns undefined when element is not in array", function() {
        var index = this.value.length,
            nestedWrapper = this.wrapper[index];

        expect(nestedWrapper).toBe(undefined);
      });
    });
  });

  describe("#set", function() {
    it("publishes update event", function() {
      var value = {a: { b: [1, 2, 3] } },
          topicId = 0,
          wrapper = new DataWrapper({value: value, path: [], eventId: topicId}),
          newValue = [100],
          data = { oldValue: 1 };

      var publish = spyOn(cortexPubSub, "publish");
      wrapper.a.b.set(newValue, data);

      expect(publish).toHaveBeenCalledWith("update" + topicId, {
        value: newValue,
        path: wrapper.a.b.getPath(),
        oldValue: 1
      });
    });
  });

  describe("#getPath", function() {
    describe("when data is a primitive", function() {
      it("returns empty array", function() {
        var wrapper = new DataWrapper({value: 1});

        expect(wrapper.getPath()).toEqual([]);
      });
    });

    describe("when data is a hash", function() {
      it("returns path to value", function() {
        var value = {},
            key = "foo";
        value[key] = "bar";
        var wrapper = new DataWrapper({value: value});

        expect(wrapper[key].getPath()).toEqual([key]);
      });
    });

    describe("when data is an array", function() {
      it("returns path to value", function() {
        var value = [0, 1, 2, 3],
            wrapper = new DataWrapper({value: value}),
            index = 0;

        expect(wrapper[index].getPath()).toEqual([index]);
      });
    });

    describe("when path is defined", function() {
      describe("when data is nested", function() {
        it("returns path of one key", function() {
          var value = {},
              key = "foo";
          value[key] = "bar";

          var wrapper = new DataWrapper({value: value}),
              childWrapper = wrapper[key];

          expect(childWrapper.getPath()).toEqual([key]);
        });
      });
    });
  });

  describe("#getKey", function() {
    it("returns current level key", function() {
      var value = {key1: {key2: 1}},
          wrapper = new DataWrapper({value: value});

      expect(wrapper.key1.getKey()).toBe("key1");
    });
  });

  describe("#getValue", function() {
    it("returns input value", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new DataWrapper({value: value});

      expect(wrapper.getValue()).toBe(value);
    });
  });

  describe("#val", function() {
    it("returns same value as .getValue", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new DataWrapper({value: value});

      expect(wrapper.val()).toBe(wrapper.getValue());
    });
  });

  describe("#getChanges", function() {
    describe("when value changes", function() {
      it("returns changes", function() {
        var oldValue = 1,
            newValue = 100,
            changes = [{ type: "update", path: [], oldValue: oldValue, newValue: newValue }],
            wrapper = new DataWrapper({value: newValue, changes: changes});

        expect(wrapper.getChanges()).toBe(changes);
      });
    });

    describe("when array value changes", function() {
      describe("when changing element value", function() {
        it("returns changes for the updated element", function() {
          var type = "update",
              oldValue = [1, 2],
              newValue = [10, 20],
              changes = [{type: type, path: [0], oldValue: 1, newValue: 10}, {type: type, path: [1], oldValue: 2, newValue: 20}],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper[0].getChanges()).toEqual([{type: type, path: [], oldValue: oldValue[0], newValue: newValue[0]}]);
          expect(wrapper[1].getChanges()).toEqual([{type: type, path: [], oldValue: oldValue[1], newValue: newValue[1]}]);
        });
      });

      describe("when adding element", function() {
        it("returns changes for the updated subtree", function() {
          var oldValue = [1, 2],
              newValue = [1, 2, 3],
              type = "update",
              changes = [{type: type, path: [2], oldValue: undefined, newValue: 3 }],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper[0].getChanges()).toEqual([]);
          expect(wrapper[1].getChanges()).toEqual([]);
          expect(wrapper[2].getChanges()).toEqual([{type: type, path: [], oldValue: oldValue[2], newValue: newValue[2]}]);
        });
      });

      describe("when deleting element", function() {
        it("returns changes for the affected subtree", function() {
          var oldValue = [1, 2],
              newValue = [1],
              type = "delete",
              changes = [{ type: type, path: [1], oldValue: 2, newValue: undefined }],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper[0].getChanges()).toEqual([]);
        });
      });
    });

    describe("when value in hash changes", function() {
      describe("when updating a key", function() {
        it("returns changes for the affected subtree", function() {
          var type = "update",
              oldValue = {a: 1, b: 2},
              newValue = {a: 10, b: 2},
              changes = [{type: type, path: ['a'], oldValue: 1, newValue: 10}],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper['b'].getChanges()).toEqual([]);

          expect(wrapper['a'].getChanges()).toEqual([{type: type, path: [], oldValue: oldValue['a'], newValue: newValue['a']}]);
        });
      });

      describe("when adding a key", function() {
        it("returns changes for new value", function() {
          var type = "new",
              oldValue = {a: 1, b: 2},
              newValue = {a: 1, b: 2, c: {d: 3} },
              changes = [{type: type, path: ['c'], oldValue: undefined, newValue: {d: 3} }],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper['c'].getChanges()).toEqual([{type: type, path: [], oldValue: oldValue['c'], newValue: newValue['c']}]);
          expect(wrapper['c']['d'].getChanges()).toEqual([{type: type, path: [], oldValue: undefined, newValue: newValue['c']['d']}]);
        });
      });

      describe("when removing a key", function() {
        it("returns changes for affected tree", function() {
          var type = "delete",
              oldValue = {a: 1, b: 2},
              newValue = {a: 1},
              changes = [{type: type, path: ['b'], oldValue: 2, newValue: undefined }],
              wrapper = new DataWrapper({value: newValue, changes: changes});

          expect(wrapper.getChanges()).toBe(changes);
          expect(wrapper['a'].getChanges()).toEqual([]);
        });
      });
    });
  });

  describe("#didChange", function() {
    describe("when key provided", function() {
      describe("when key is in an object", function() {
        describe("when there is a change", function() {
          it("returns true", function() {
            var value = {a: 1, b: 2},
                changes = [{type: "update", path: ["a"], oldValue: 10, newValue: 1}],
                wrapper = new DataWrapper({value: value, changes: changes});

            expect(wrapper.didChange('a')).toBe(true);
          });
        });

        describe("when there is no change", function() {
          it("returns true", function() {
            var value = {a: 1, b: 2},
                wrapper = new DataWrapper({value: value});

            expect(wrapper.didChange('a')).toBe(false);
          });
        });
      });

      describe("when key is in an array", function() {
        describe("when there is a change", function() {
          it("returns true", function() {
            var value = [0, 1, 2],
                changes = [{type: "update", path: [0], oldValue: 10, newValue: 0}],
                wrapper = new DataWrapper({value: value, changes: changes});

            expect(wrapper.didChange(0)).toBe(true);
          });
        });

        describe("when there is no change", function() {
          it("returns true", function() {
            var value = [0, 1, 2],
                wrapper = new DataWrapper({value: value});

            expect(wrapper.didChange(0)).toBe(false);
          });
        });
      });
    });

    describe("when key not provided", function() {
      describe("when there is no change", function() {
        it("returns false", function() {
          var value = {a: 1},
              wrapper = new DataWrapper({value: value});

          expect(wrapper.didChange()).toBe(false);
        });
      });

      describe("when there is change", function() {
        it("returns true", function() {
          var value = {a: 1},
              changes = [{type: "update", path: ['a'], oldValue: 2, newValue: 1 }],
              wrapper = new DataWrapper({value: value, changes: changes});

          expect(wrapper.didChange()).toBe(true);
        });
      });
    });
  });

  // describe("#isEqual", function() {
  //   describe("when not equal", function() {
  //     it("returns false", function() {
  //       // Create deeply nested data
  //       var value1 = {a: {b: {c: {d: {f: [{g: {h: 1}}]}}}}},
  //           value2 = {a: {b: {c: {d: {f: [{g: {h: 2}}]}}}}},
  //           wrapper1 = new DataWrapper({value: value1}),
  //           wrapper2 = new DataWrapper({value: value2});

  //       expect(wrapper1.isEqual(wrapper2)).toBe(false);
  //     });
  //   });

  //   describe("when equal", function() {
  //     it("returns true", function() {
  //       // Create deeply nested data
  //       var value1 = {a: {b: {c: {d: {f: [{g: {h: 1}}]}}}}},
  //           value2 = {a: {b: {c: {d: {f: [{g: {h: 1}}]}}}}},
  //           wrapper1 = new DataWrapper({value: value1}),
  //           wrapper2 = new DataWrapper({value: value2});

  //       expect(wrapper1.isEqual(wrapper2)).toBe(true);
  //     });
  //   })
  // });

  describe("#forEach", function() {
    describe("when array", function() {
      it("iterates over all elements of wrapper array", function() {
        var value = [1, 1, 2, 3, 5, 8, 13],
            wrapper = new DataWrapper({value: value}),
            out = [];

        wrapper.forEach(function(obj) {
          return out.push(obj.getValue());
        });

        expect(out).toEqual(value);
      });
    });

    describe("when a hash", function() {
      it("iterates over every key and element pair in the object", function() {
        var value = {a: 1,b: 2,c: 3},
            wrapper = new DataWrapper({value: value}),
            out = [];

        wrapper.forEach(function(key, wrapper) {
          out.push("" + key + ":" + (wrapper.getValue()));
        });

        expect(out).toEqual(["a:1", "b:2", "c:3"]);
      });
    });
  });

  describe("#remove", function() {
    it("publishes remove event", function() {
      var value = 1,
          topicId = 0,
          wrapper = new DataWrapper({value: value, path: [], eventId: topicId}),
          publish = spyOn(cortexPubSub, "publish");

      wrapper.remove();

      expect(publish).toHaveBeenCalledWith("remove" + topicId, {path: wrapper.getPath()});
    });
  });
});
