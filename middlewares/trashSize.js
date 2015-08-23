'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libTreeJs = require('../lib/tree.js');

var _prettyBytes = require('pretty-bytes');

var _prettyBytes2 = _interopRequireDefault(_prettyBytes);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libUtilsJs = require('../lib/utils.js');

var debug = require('debug')('explorer:trashSize');

function trashSize(config) {

  return function (req, res, next) {

    res.locals.trashSize = '0 B';

    if (config.remove.disabled || config.remove.method != 'mv') {
      return next();
    }

    var v = config.remove.path;

    if (req.user.trash) {
      v = _path2['default'].resolve(req.user.home, req.user.trash);
    }

    (0, _libTreeJs.tree)(v, { maxDepth: 1 }).then(function (tree) {

      if (tree.tree.length == 0) {
        return next();
      }

      var size = 0;

      for (var i in tree.tree) {
        size += tree.tree[i].size;
      }

      debug('Trash size %s', size);

      res.locals.trashSize = (0, _prettyBytes2['default'])(size);

      return next();
    })['catch']((0, _libUtilsJs.handleSystemError)(next));
  };
}

exports.trashSize = trashSize;