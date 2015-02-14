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
