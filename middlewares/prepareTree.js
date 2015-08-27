'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _libSortJs = require('../lib/sort.js');

var _libUtilsJs = require('../lib/utils.js');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var debug = require('debug')('explorer:middlewares:prepareTree');
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
    }, { remove: config.remove }, { archive: config.archive }, { upload: config.upload });

    var opts = (0, _libUtilsJs.extend)(res.locals, config.tree, config.pagination);

    if (req.user) {
      for (var i in req.user) {
        if (~['remove', 'archive', 'upload'].indexOf(i) && req.user[i] != '' && req.user[i] != req.user.home) {
          opts[i].path = _path2['default'].resolve(req.user.home, req.user[i]);
        }
      }
    }

    if (!!req.user.readonly === true || opts.remove.disabled || opts.path == opts.remove.trash) {
      res.locals.canRemove = false;
    } else {
      res.locals.canRemove = config.remove && config.remove.method ? true : false;
    }

    if (res.locals.sort) opts.sortMethod = _libSortJs.sort[res.locals.sort](opts);

    if (req.query.limit) {
      opts.limit = !!parseInt(req.query.limit) ? req.query.limit : opts.limit;
    }

    if (req.user.ignore) {

      for (var i in req.user.ignore) {
        if ((0, _minimatch2['default'])(opts.path, req.user.ignore[i])) {
          return next(new _libHTTPErrorJs2['default']('Forbidden', 403));
        }
      }

      opts.skip = function (v) {
        for (var i in req.user.ignore) {
          if ((0, _minimatch2['default'])(v, req.user.ignore[i])) {
            return false;
          }
        }

        return true;
      };
    }

    req.options = opts;

    //forcing accept header to rss
    if (req.query.rss && req.query.rss == 1) {
      req.headers['accept'] = 'application/rss+xml';
    }

    debug('Options: \n%o', opts);

    return next();
  };
}

function sanitizeCheckboxes(req, res, next) {
  var paths = [];
  var directories = [];

  if (typeof req.body.path == 'string') req.body.path = [req.body.path];

  //validating paths
  for (var i in req.body.path) {
    var path = (0, _libUtilsJs.higherPath)(req.options.root, req.body.path[i]);

    if (path != req.options.root) {
      try {
        var stat = _fs2['default'].statSync(path);
      } catch (err) {
        return (0, _libUtilsJs.handleSystemError)(next)(err);
      }

      if (stat.isDirectory()) {
        directories.push(path);
      } else {
        paths.push(path);
      }
    }
  }

  req.options.directories = directories;
  req.options.paths = paths;

  next();
}

exports.prepareTree = prepareTree;
exports.sanitizeCheckboxes = sanitizeCheckboxes;