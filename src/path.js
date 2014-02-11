var Path = (function() {
  function Path(parent, key) {
    this.parent = parent;
    this.key = key;
  }

  Path.prototype.getKey = function() {
    return this.key;
  };

  Path.prototype.getParent = function() {
    return this.parent;
  };

  Path.prototype.getPath = function(path) {
    if (path == null) {
      path = [];
    }
    path.splice(0, 0, this.key);
    if (this.parent != null) {
      return this.parent.getPath(path);
    } else {
      return path;
    }
  };

  return Path;
})();

module.exports = Path;
