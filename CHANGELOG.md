# 2.1.1
- Update deep-diff to 0.3.8

# 2.1.0
- Update nested wrapper paths when array length changes (Issue #106)

# 2.0.3
- Fix object remove method for 0 key

# 2.0.2
- Fix error inserting into 0 element by checking diff.index is undefined

# 2.0.1
- Add optional thisArg to `map` method

# 2.0.0
- support immutable data structure
- remove `didChange` and `getChanges`
- remove `off('update')`
- replace `on('update')` with `onUpdate`
- replace `insertAt` and `removeAt` with `splice`
- replace `add` with `merge`
- swap `remove` and `destroy` method

# 0.8.7
- fix multiple changes bug

# 0.8.6
- provide `deepDiff` and `deepClone` class methods

# 0.8.5
- upgrade babelify

# 0.8.4
- derequire build file

# 0.8.3
- fix insertAt when inserting an array (previously the insert array gets flatten into the parent array)

# 0.8.2
- fix diffPath bug (should copy path to diffPath instead of simply setting it to path)

# 0.8.1
- revert back to regular for loop (instead of es6 for...of) to remove polyfill dependency

# 0.8.0
- expose changes
- `getChagnes` and `didChange` methods

# 0.7.0 (February 14, 2015)
- ES6 rewrite

# 0.6.3 (February 9, 2015)
- Batch rewrap

# 0.6.2 (August 13, 2014)
- Fix batch callback bug

# 0.6.1 (May 19, 2014)
Features:
- Add `filter` method

# 0.6.0 (May 14, 2014)
Features:
- Run callbacks in batch so that multiple updates in the same run loop result in a single callbacks run.

# 0.5.3 (May 6, 2014)
Features:
- Support multiple callbacks
- Add ``off("update", callback)`` method

# 0.5.2 (May 2, 2014)

Features:
- Add ``on("update", callback)``

# 0.5.1 (April 16, 2014)

Features:
- Deprecate ``delete`` method and replace with ``destroy``

# 0.5.0 (February 25, 2014)

Features:
- Improved rewrapping performance by only wrapping at the parent of subtree with change.
- Add ``shift()`` and ``unshift``
