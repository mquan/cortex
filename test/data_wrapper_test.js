var DataWrapper = require("../src/data_wrapper");
var Cortex = require("../src/cortex");

describe("DataWrapper", function() {
  describe("#get", function() {
    describe("when data is a hash", function() {
      beforeEach(function() {
        this.value = {};
        this.key = "foo";
        this.val = "bar";
        this.value[this.key] = this.val;

        this.wrapper = new DataWrapper(this.value);
      });

      it("returns wrapper of nested value", function() {
        var nestedWrapper = this.wrapper.get(this.key);

        expect(nestedWrapper.getValue()).toBe(this.val);
      });

      it("returns undefined when key is not defined", function() {
        expect(this.wrapper.get("randomKey")).toBe(void 0);
      });
    });

    describe("when data is an array", function() {
      beforeEach(function() {
        this.value = [1, 2, 3];

        this.wrapper = new DataWrapper(this.value);
      });

      it("returns wrapper of an array element", function() {
        var index = 1,
            nestedWrapper = this.wrapper.get(index);

        expect(nestedWrapper.getValue()).toBe(this.value[index]);
      });

      it("returns undefined when element is not in array", function() {
        var index = this.value.length,
            nestedWrapper = this.wrapper.get(index);

        expect(nestedWrapper).toBe(void 0);
      });
    });
  });

  describe("#set", function() {
    it("calls update on top level wrapper", function() {
      var value = {a: { b: [1, 2, 3] } },
          wrapper = new DataWrapper(value);
      wrapper["update"] = function(value) {
        return value;
      };
      update = spyOn(wrapper, "update");
      wrapper.get("a").get("b").set([100]);

      expect(update).toHaveBeenCalled();
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

        expect(wrapper.get(key).getPath()).toEqual([key]);
      });
    });

    describe("when data is an array", function() {
      it("returns path to value", function() {
        var value = [0, 1, 2, 3],
            wrapper = new DataWrapper(value),
            index = 0;

        expect(wrapper.get(index).getPath()).toEqual([index]);
      });
    });

    describe("when path is defined", function() {
      describe("when data is nested", function() {
        it("returns path of one key", function() {
          var value = {},
              key = "foo";
          value[key] = "bar";

          var wrapper = new DataWrapper(value),
              childWrapper = wrapper.wrappers[key];

          expect(childWrapper.getPath()).toEqual([key]);
        });
      });
    });
  });

  describe("#getValue", function() {
    it("returns input value", function() {
      var value = { key1: 1, key2: 2 },
          wrapper = new DataWrapper(value);

      expect(wrapper.getValue()).toBe(value);
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
    describe("when not a root", function() {
      describe("when parent is an array", function() {
        it("removes the specified element in parent array", function() {
          var value = [1, 2, 3, 4, 5],
              length = value.length,
              wrapper = new Cortex(value);

          wrapper.get(0).remove();

          expect(wrapper.count()).toBe(length - 1);
          expect(wrapper.get(0).getValue()).toBe(2);
        });
      });

      describe("when parent is a hash", function() {
        it("removes the specified key and value pair", function() {
          var value = { a: 1, b: 2, c: 3 },
              wrapper = new Cortex(value);

          wrapper.get("a").remove();

          expect(wrapper.get("a")).toBe(undefined);
          expect(wrapper.hasKey("a")).toBe(false);
        });
      });
    });

    describe("when a root", function() {
      it("removes itself", function() {
        var wrapper = new Cortex(1);

        wrapper["update"] = this.updateMethod;

        wrapper.remove();

        expect(wrapper.getValue()).toBe(undefined);
      });
    });
  });
});
