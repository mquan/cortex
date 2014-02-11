var Path = require("../src/path");

describe("Path", function() {
  describe("#getKey", function() {
    it("returns key", function() {
      var key = "myKey",
          path = new Path(null, key);

      expect(path.getKey()).toBe(key);
    });
  });

  describe("#getParent", function() {
    it("returns parent", function() {
      var parent = new Path(null, "key1"),
          path = new Path(parent, "key2");

      expect(path.getParent()).toBe(parent);
    });

    it("returns null when parent is null", function() {
      var path = new Path(null, "key");

      expect(path.getParent()).toBe(null);
    });
  });

  describe("#getPath", function() {
    it("returns full path", function() {
      var key1 = "key1",
          key2 = "key2",
          parent = new Path(null, key1),
          path = new Path(parent, key2),
          fullPath = path.getPath();

      expect(fullPath).toEqual([key1, key2]);
    });
  });
});
