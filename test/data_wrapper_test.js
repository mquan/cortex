var cortexPubSub = require("../src/pubsub"),
ArrayWrapper = require("../src/wrappers/array"),
HashWrapper = require("../src/wrappers/hash"),
DataWrapper = require("../src/data_wrapper")([ArrayWrapper, HashWrapper], cortexPubSub);

describe("DataWrapper", function() {
  describe("accessing nested wrapper", function() {
    describe("when data is a hash", function() {
      beforeEach(function() {
        this.value = {};
        this.key = "foo";
        this.val = "bar";
        this.value[this.key] = this.val;

        this.wrapper = new DataWrapper(this.value);
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

        this.wrapper = new DataWrapper(this.value);
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
          wrapper = new DataWrapper(value, [], topicId),
          newValue = [100];

      publish = spyOn(cortexPubSub, "publish");
      wrapper.a.b.set(newValue, false);

      expect(publish).toHaveBeenCalledWith("update" + topicId, {
        value: newValue,
        path: wrapper.a.b.getPath(),
        forceUpdate: false
      });
    });
  });

  describe("#getPath", function() {
    describe("when data is a primitive", function() {
      it("returns empty array", function() {
        var wrapper = new DataWrapper(1);

        expect(wrapper.getPath()).toEqual([]);
      });
    });

    describe("when data is a hash", function() {
      it("returns path to value", function() {
        var value = {},
            key = "foo";
        value[key] = "bar";
        var wrapper = new DataWrapper(value);

        expect(wrapper[key].getPath()).toEqual([key]);
      });
    });

    describe("when data is an array", function() {
      it("returns path to value", function() {
        var value = [0, 1, 2, 3],
            wrapper = new DataWrapper(value),
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

          var wrapper = new DataWrapper(value),
              childWrapper = wrapper[key];

          expect(childWrapper.getPath()).toEqual([key]);
        });
      });
    });
  });

  describe("#getKey", function() {
    it("returns current level key", function() {
      var value = {key1: {key2: 1}},
          wrapper = new DataWrapper(value);

      expect(wrapper.key1.getKey()).toBe("key1");
    });
  });

  describe("#getValue", function() {
    it("returns input value", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new DataWrapper(value);

      expect(wrapper.getValue()).toBe(value);
    });
  });

  describe("#val", function() {
    it("returns same value as .getValue", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new DataWrapper(value);

      expect(wrapper.val()).toBe(wrapper.getValue());
    });
  });

  describe("#forEach", function() {
    describe("when array", function() {
      it("iterates over all elements of wrapper array", function() {
        var value = [1, 1, 2, 3, 5, 8, 13],
            wrapper = new DataWrapper(value),
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
            wrapper = new DataWrapper(value),
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
          wrapper = new DataWrapper(value, [], topicId),
          publish = spyOn(cortexPubSub, "publish");

      wrapper.remove();

      expect(publish).toHaveBeenCalledWith("remove" + topicId, {path: wrapper.getPath()});
    });
  });
});
