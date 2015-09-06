var cortexPubSub = require("../src/pubsub"),
    ImmutableWrapper = require("../src/immutable_wrapper")(cortexPubSub);

describe("ImmutableWrapper", function() {
  describe("initialization", function() {
    describe("when data is a primitive", function() {
      beforeEach(function() {
        this.value = 42;
        this.wrapper = new ImmutableWrapper({value: this.value});
      });

      it("returns wrapper of value", function() {
        expect(this.wrapper.getValue()).toBe(this.value);
      });
    });

    describe("when data is an object", function() {
      beforeEach(function() {
        this.value = {a: 1, b: 2};
        this.wrapper = new ImmutableWrapper({value: this.value});
      });

      it("returns wrappers of object and each nested key", function() {
        expect(this.wrapper.getValue()).toBe(this.value);
        expect(this.wrapper.a.getValue()).toBe(1);
        expect(this.wrapper.b.getValue()).toBe(2);
      });

      it("returns undefined when key is not defined", function() {
        expect(this.wrapper.c).toBe(undefined);
      });
    });

    describe("when data is an array", function() {
      beforeEach(function() {
        this.value = [0, 1];
        this.wrapper = new ImmutableWrapper({value: this.value});
      });

      it("returns wrappers of array and each element", function() {
        expect(this.wrapper.getValue()).toBe(this.value);
        for(var i = 0, ii = this.value.length; i < ii; i++) {
          expect(this.wrapper[i].getValue()).toBe(this.value[i]);
        }
      });

      it("returns undefined when element is not defined", function() {
        expect(this.wrapper[this.value.length]).toBe(undefined);
      });
    });
  });

  describe("#set", function() {
    beforeEach(function() {
      this.topic = 1;
      this.value = {a: { b: [1, 2] }, c: 1, d: {e: 2}};
      this.wrapper = new ImmutableWrapper({
        value: this.value,
        eventId: this.topic,
        path: []
      });
      this.publish = spyOn(cortexPubSub, "publish");
    });

    describe("when there is no change", function() {
      it("does not publish update event", function() {
        this.wrapper.set({a: { b: [1, 2] }, c: 1, d: {e: 2}});

        expect(this.publish).not.toHaveBeenCalled();
      });
    });

    describe("when there is a change", function() {
      describe("when change is an update", function() {
        it("publishes event for update action", function() {
          var value = 100;
          this.wrapper.c.set(value);

          expect(this.publish).toHaveBeenCalledWith("update" + this.topic, [{
            action: 'update',
            path: ['c'],
            value: value
          }]);
        });
      });

      describe("when change is an add", function() {
        describe("when add to an object", function() {
          it("publishes event for add action", function() {
            // this fails b/c action is incorrect.
            // make it consistent
            this.wrapper.d.set({e: 2, f: 3});
            var diffs = [{
              action: 'add',
              path: ['d', 'f'],
              value: 3
            }];

            expect(this.publish).toHaveBeenCalledWith("update" + this.topic, diffs);
          });
        });

        describe("when add to an array", function() {
          it("publishes event for add action", function() {
            this.wrapper.a.b.set([1, 2, 3]);
            var diffs =[{
              action: 'add',
              path: ['a', 'b', 2],
              value: 3
            }];

            expect(this.publish).toHaveBeenCalledWith("update" + this.topic, diffs);
          });
        });
      });

      describe("when change is a delete", function() {
        describe("when delete a key in an object", function() {
          it("publishes event for delete action", function() {
            this.wrapper.d.set({});
            var diffs = [{
              action: 'delete',
              path: ['d', 'e'],
              value: undefined
            }];

            expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
          });
        });

        describe("when delete an element from an array", function() {
          it("publishes event for delete action", function() {
            this.wrapper.a.b.set([1]);
            var diffs = [{
              action: 'delete',
              path: ['a', 'b', 1],
              value: undefined
            }];

            expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
          });
        });
      });
    });

    describe("when there are multiple changes", function() {
      it("publishes update event with multiple diffs", function() {
        this.wrapper.set({a: { b: [1, 2, 3] }, c: 1, d: {}});
        var diffs =[{
          action: 'add',
          path: ['a', 'b', 2],
          value: 3
        }, {
          action: 'delete',
          path: ['d', 'e'],
          value: undefined
        }];

        expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
      });
    });
  });

  describe("#forEach", function() {
    describe("when array", function() {
      it("iterates over all elements of wrapper array", function() {
        var value = [1, 1, 2, 3, 5, 8, 13],
            wrapper = new ImmutableWrapper({value: value}),
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
            wrapper = new ImmutableWrapper({value: value}),
            out = [];

        wrapper.forEach(function(key, wrapper) {
          out.push("" + key + ":" + (wrapper.getValue()));
        });

        expect(out).toEqual(["a:1", "b:2", "c:3"]);
      });
    });
  });

  describe("#destroy", function() {
    beforeEach(function() {
      this.topic = 1;
      this.value = {a: { b: [1, 2] }, c: 1, d: {e: 2}};
      this.wrapper = new ImmutableWrapper({
        value: this.value,
        eventId: this.topic,
        path: []
      });
      this.publish = spyOn(cortexPubSub, "publish");
    });

    describe("when destroying root object", function() {
      it("publishes delete event for the node", function() {
        let diffs = [{
          action: 'delete',
          path: []
        }];

        this.wrapper.destroy();

        expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
      });
    });

    describe("when destroying a nested key in object", function() {
      it("publishes delete event for the node", function() {
        let diffs = [{
          action: 'delete',
          path: ['c']
        }];

        this.wrapper.c.destroy();

        expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
      });
    });

    describe("when destroying an element in array", function() {
      it("publishes delete event for the node", function() {
        let diffs = [{
          action: 'delete',
          path: ['a', 'b', 1]
        }];

        this.wrapper.a.b[1].destroy();

        expect(this.publish).toHaveBeenCalledWith('update' + this.topic, diffs);
      });
    });
  });

  describe("#getPath", function() {
    describe("when data is not nested", function() {
      it("returns empty array", function() {
        var wrapper = new ImmutableWrapper({value: 1});

        expect(wrapper.getPath()).toEqual([]);
      });
    });

    describe("when data is nested in a hash", function() {
      it("returns array with key", function() {
        var value = {foo: "bar"},
            wrapper = new ImmutableWrapper({value: value});

        expect(wrapper["foo"].getPath()).toEqual(["foo"]);
      });
    });

    describe("when data is nested in an array", function() {
      it("returns array with element index", function() {
        var value = [0, 1],
            wrapper = new ImmutableWrapper({value: value});

        expect(wrapper[1].getPath()).toEqual([1]);
      });
    });
  });

  describe("#getKey", function() {
    it("returns current level key", function() {
      var value = {key1: {key2: 1}},
          wrapper = new ImmutableWrapper({value: value});

      expect(wrapper.key1.getKey()).toBe("key1");
    });
  });

  describe("#getValue", function() {
    it("returns input value", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new ImmutableWrapper({value: value});

      expect(wrapper.getValue()).toBe(value);
    });
  });
});