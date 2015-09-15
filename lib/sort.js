/**
 * Sort methods
 * @param object options (req.options)
 * @see Middlwares#prepareTree
 * @see Tree
 * @return funtion sort function fn(a, b) where a and b are path objects
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var sort = {
  time: function time(options) {
    return function timeSort(a, b) {
      var s = a.mtime - b.mtime;

      return options.order == 'desc' ? s : -s;
    };
  },
  name: function name(options) {
    return function (a, b) {
      var s = a.name.charCodeAt(0) - b.name.charCodeAt(0);

      return options.order == 'desc' ? s : -s;
    };
  },
  size: function size(options) {
    return function (a, b) {
      var s = a.size - b.size;

      return options.order == 'desc' ? s : -s;
    };
  }
};

exports.sort = sort;