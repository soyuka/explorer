'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _prettyBytes = require('pretty-bytes');

var _prettyBytes2 = _interopRequireDefault(_prettyBytes);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _utilsJs = require('./utils.js');

var debug = require('debug')('explorer:tree');
var fs = _bluebird2['default'].promisifyAll(require('fs'));

var buildBreadcrumb = function buildBreadcrumb(root, path) {
  var breadcrumbs = [{ path: root, name: root }];

  if (!path) {
    return breadcrumbs;
  }

  var paths = path.replace(root, '').split('/').filter(function (v) {
    return v != '';
  });

  for (var i in paths) {
    breadcrumbs[parseInt(i) + 1] = {
      path: _path2['default'].join(breadcrumbs[i].path, paths[i]),
      name: paths[i]
    };
  }

  return breadcrumbs;
};

/**
 * @param string file
 * @param object root (@see pathInfo)
 * @param object options:
 *   - int maxDepth (10)
 *   - function filter (@see noDotFiles)
 */
var directorySize = function directorySize(file, root, options) {

  options = _util2['default']._extend({ filter: _utilsJs.noDotFiles, maxDepth: 10, concurrency: 100, skip: function skip() {} }, options);

  var filePath = _path2['default'].resolve(root.path, file);
  var depth = file.split(_path2['default'].sep).length;

  if (root.depth < depth) root.depth = depth;

  if (root.depth >= options.maxDepth) {
    root.depth = Infinity;
    return _bluebird2['default'].resolve(root);
  }

  return fs.statAsync(filePath).then(function (stat) {
    if (stat.isDirectory()) {
      return fs.readdirAsync(filePath).filter(options.filter, { concurrency: options.concurrency }).filter(options.skip, { concurrency: options.concurrency }).each(function (v) {
        return directorySize(_path2['default'].join(file, v), root, options);
      });
    } else {
      root.size += stat.size;
      return _bluebird2['default'].resolve(root);
    }
  })['catch'](function (err) {

    if (err.code !== 'ENOENT') {
      console.error('Failed reading stat', err);
      return _bluebird2['default'].reject(err);
    }

    return _bluebird2['default'].resolve(root);
  });
};

/**
 * Handles path argument, readdir if it's a string or return Promise.all
 * @param mixed path
 * @return array Promises
 */
var paths = function paths(path) {
  if (typeof path === 'string') return fs.readdirAsync(path);else if (_util2['default'].isArray(path)) return _bluebird2['default'].all(path);else throw new TypeError('Path must be defined');
};

/**
 * @param string path
 * @param object options
 *   - int page (0) - the current page
 *   - int maxDepth (10) - max depth for directory size computation
 *   - int limit (100)
 *   - int concurrency (100)
 * @return Promise
 * @catchable
 */
var tree = function tree(path, options) {

  if (!options) {
    options = {};
  }

  options.page = parseInt(options.page) || 1;
  options.limit = parseInt(options.limit) || 100;
  options.skip = options.skip ? options.skip : function (v) {
    return true;
  };

  debug('Tree for path %s and options %o', path, options);

  var pages = 0;
  var concurrency = { concurrency: options.concurrency || 100 };
  var root = _util2['default'].isArray(path) ? options.root : path;
  var num = 0;

  var calcDirectorySize = function calcDirectorySize(f) {

    if (f.ext !== 'app' && f.directory !== true) {
      return _bluebird2['default'].resolve(f);
    }

    return directorySize('', f, options).then(function (v) {
      return _bluebird2['default'].resolve(f);
    });
  };

  return paths(path).filter(_utilsJs.noDotFiles, concurrency).filter(options.skip, concurrency).map(function (f) {

    var v = _path2['default'].join(root, f);

    // debug('Map stat', f)

    return _bluebird2['default'].join(fs.statAsync(v), (0, _utilsJs.pathInfo)(v), function (stat, info) {
      info.size = stat.size;
      info.mtime = stat.mtime.getTime();
      info.lastModified = (0, _moment2['default'])(stat.mtime).format('llll');

      // info.atime = stat.atime.getTime()
      // info.lastAccessed = moment(stat.atime).format('llll')

      if (stat.isDirectory()) {
        info.directory = true;
        info.type = 'directory';
        info.depth = 0;
      }

      // debug('info', info)

      return info;
    })['catch'](function (err) {
      if (err.code === 'ENOENT') {
        console.error('Stat ENOENT', err);
      }
    });
  }, concurrency).map(options.sort == 'size' ? calcDirectorySize : function (e) {
    return e;
  }).call('sort', options.sortMethod || function () {
    return;
  }).filter(function (value, index, length) {

    if (!num) num = length;

    if (!pages) pages = Math.ceil(length / options.limit);

    if (options.page == 1) {
      return index < options.limit * options.page;
    }

    return index >= (options.page - 1) * options.limit && index < options.page * options.limit;
  }, concurrency).map(options.sort !== 'size' ? calcDirectorySize : function (e) {
    return e;
  }).map(function (f) {
    f.humanSize = (0, _prettyBytes2['default'])(f.size);

    return f;
  }, concurrency).then(function (tree) {
    var breadcrumb = buildBreadcrumb(options.root, options.path);

    return _bluebird2['default'].resolve(_util2['default']._extend({
      tree: tree,
      pages: pages,
      num: num,
      breadcrumb: breadcrumb
    }, options));
  });
};

exports.tree = tree;