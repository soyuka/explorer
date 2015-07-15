'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prettyBytes = require('pretty-bytes');

var _prettyBytes2 = _interopRequireDefault(_prettyBytes);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _libTreeJs = require('../lib/tree.js');

var _libSortJs = require('../lib/sort.js');

var _libUtilsJs = require('../lib/utils.js');

var debug = require('debug')('explorer:middlewares');

function trashSize(config) {

  return function (req, res, next) {

    res.locals.trashSize = '0 B';

    if (!config.remove || !config.remove.method == 'mv') {
      return next();
    }

    var v = config.remove.trash;

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
    })['catch'](next);
  };
}

/**
 * Prepare tree locals et validate queries 
 * @param config
 * @return function middleware(req, res, next)
 */
function prepareTree(config) {
  return function (req, res, next) {
    //should be an app.param
    if (!req.query.page || req.query.page < 0) req.query.page = 1;

    req.query.page = parseInt(req.query.page);

    if (req.query.sort) {
      if (!_libSortJs.sort.hasOwnProperty(req.query.sort)) {
        req.query.sort = null;
      }
    }

    if (! ~['asc', 'desc'].indexOf(req.query.order)) {
      req.query.order = 'asc';
    }

    if (!req.query.path) req.query.path = './';

    if (req.query.search && config.search.method !== 'native') {
      req.query.search = (0, _libUtilsJs.secureString)(req.query.search);
    }

    res.locals = (0, _libUtilsJs.extend)(res.locals, {
      search: req.query.search,
      sort: req.query.sort || '',
      order: req.query.order || '',
      page: req.query.page,
      root: _path2['default'].resolve(req.user.home),
      path: (0, _libUtilsJs.higherPath)(req.user.home, req.query.path),
      parent: (0, _libUtilsJs.higherPath)(req.user.home, _path2['default'].resolve(req.query.path, '..')),
      buildUrl: _libUtilsJs.buildUrl
    });

    req.options = (0, _libUtilsJs.extend)(res.locals, config.tree, config.pagination, { remove: config.remove }, { archive: config.archive });

    if (req.user.trash) {
      req.options.remove.trash = _path2['default'].resolve(req.user.home, req.user.trash);
    }

    if (!!req.user.readonly === true || req.options.path == req.options.remove.trash) {
      res.locals.canRemove = false;
    } else {
      res.locals.canRemove = config.remove && config.remove.method ? true : false;
    }

    if (req.user.archive) {
      req.options.archive.temp = _path2['default'].resolve(req.user.home, req.user.archive);
    }

    if (res.locals.sort) req.options.sortMethod = _libSortJs.sort[res.locals.sort](req.options);

    if (req.user.ignore) {

      for (var i in req.user.ignore) {
        if ((0, _minimatch2['default'])(req.options.path, req.user.ignore[i])) {
          return next(new Error('Forbidden'));
        }
      }

      req.options.skip = function (v) {
        for (var i in req.user.ignore) {
          if ((0, _minimatch2['default'])(v, req.user.ignore[i])) {
            return false;
          }
        }

        return true;
      };
    }

    debug('Options: %o', req.options);

    return next();
  };
}

exports.trashSize = trashSize;
exports.prepareTree = prepareTree;