'use strict';
/**
 * Sort methods
 * @param object options (req.options)
 * @see Middlwares#prepareTree
 * @see Tree
 * @return funtion sort function fn(a, b) where a and b are path objects
 */
var sort = {
  time: function(options) {
    return function timeSort(a, b) {
        var s = a.mtime - b.mtime

        return options.order == 'desc' ? s : -s
    }
  },
  name: function(options) {
    return function (a, b) {
      var s = a.name.charCodeAt(0) - b.name.charCodeAt(0)

      return options.order == 'desc' ? s : -s
    } 
  },
  size: function(options) {
    return function(a, b) {
      var s = a.size - b.size

      return options.order == 'desc' ? s : -s
    } 
  }
}

module.exports = sort
