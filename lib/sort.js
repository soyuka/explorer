'use strict';

var DESC = 'desc'

/**
 * Sort methods
 * @param object options (req.options)
 * @see Middlwares#prepareTree
 * @see Tree
 * @return funtion sort function fn(a, b) where a and b are path objects
 */
var sort = {
  time: function (options) {
    return function timeSort (a, b) {
      var s = a.mtime - b.mtime
      return options.order === DESC ? s : -s
    }
  },
  atime: function (options) {
    return function atimeSort (a, b) {
      var s = a.atime - b.atime
      return options.order === DESC ? s : -s
    }
  },
  name: function (options) {
    return function nameSort (a, b) {
      var length = Math.min(a.name.length, b.name.length)
      var i = 0
      var s = a.name.charCodeAt(i) - b.name.charCodeAt(i)

      while (s === 0 && i++ < length) {
        s = a.name.charCodeAt(i) - b.name.charCodeAt(i)
      }

      return options.order === DESC ? s : -s
    }
  },
  size: function (options) {
    return function sizeSort (a, b) {
      var s = a.size - b.size
      return options.order === DESC ? s : -s
    }
  }
}

module.exports = sort
