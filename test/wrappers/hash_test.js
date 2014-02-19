var Cortex = require("../../src/cortex");

describe("HashWrapper", function() {
  beforeEach(function() {
    this.value = {a: 1, b: 2, c: 3};
    this.wrapper = new Cortex(this.value);
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

  describe("#delete", function() {
    it("removes specified key value pair", function() {
      expect(this.wrapper.delete("a")).toBe(1);
      expect(this.wrapper.get("a")).toBe(void 0);
      expect(this.wrapper.get("b").getValue()).toBe(2);
      expect(this.wrapper.get("c").getValue()).toBe(3);
    });
  });

  describe("#add", function() {
    it("adds key-value pair", function() {
      expect(this.wrapper.add("d", 4)).toBe(4);
      expect(this.wrapper.hasKey("d")).toBe(true);
      expect(this.wrapper.get("d").getValue()).toBe(4);
      expect(this.wrapper.keys()).toEqual(["a", "b", "c", "d"]);
      expect(this.wrapper.values()).toEqual([1, 2, 3, 4]);
    });
  });
});
