'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _utilsJs = require('./utils.js');

var p = require('path');
var debug = require('debug')('explorer:tree');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var mime = require('mime');
var prettyBytes = require('pretty-bytes');
var util = require('util');
var moment = require('moment');

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
      path: p.join(breadcrumbs[i].path, paths[i]),
      name: paths[i]
    };
  }

  return breadcrumbs;
};

/**
 * Give path informations
 * @param string path
 * @param string filename
 */
var pathInfo = function pathInfo(path, filename) {

  var o = {
    name: filename,
    ext: p.extname(filename),
    dirname: p.dirname(path),
    path: path
  };

  var m = mime.lookup(o.path).split('/');

  o.type = m[0];

  var filetype = m[1];

  if (~['.zip', '.rar', '.iso', '.tar'].indexOf(o.ext)) {
    o.type = 'archive';
  }

  if (! ~['application', 'video', 'audio', 'image', 'text', 'archive'].indexOf(o.type)) {
    o.type = 'application';
  }

  return Promise.resolve(o);
};

/**
 * @param string file
 * @param object root (@see pathInfo)
 * @param object options:
 *   - int maxDepth (10)
 *   - function filter (@see noDotFiles)
 */
var directorySize = function directorySize(file, root, options) {

  options = util._extend({ filter: _utilsJs.noDotFiles, maxDepth: 10, concurrency: 100 }, options);

  var filePath = p.resolve(root.path, file);
  var depth = file.split(p.sep).length;

  if (root.depth < depth) root.depth = depth;

  if (root.depth >= options.maxDepth) {
    root.depth = Infinity;
    return Promise.resolve(root);
  }

  return fs.statAsync(filePath).then(function (stat) {
    if (stat.isDirectory()) {
      return fs.readdirAsync(filePath).filter(options.filter, { concurrency: options.concurrency }).each(function (v) {
        return directorySize(p.join(file, v), root, options);
      });
    } else {
      root.size += stat.size;
      return Promise.resolve(root);
    }
  })['catch'](function (err) {

    if (err.code !== 'ENOENT') {
      console.error('Failed reading stat', err);
      return Promise.reject(err);
    }

    return Promise.resolve(root);
  });
};

var paths = function paths(path) {
  if (typeof path === 'string') return fs.readdirAsync(path);else if (util.isArray(path)) return Promise.all(path);
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

  debug('Tree for path', path);

  var pages = 0;
  var concurrency = { concurrency: options.concurrency || 100 };
  var root = util.isArray(path) ? options.root : path;
  var num = 0;

  var calcDirectorySize = function calcDirectorySize(f) {

    if (f.ext !== 'app' && f.directory !== true) {
      return Promise.resolve(f);
    }

    return directorySize('', f, options).then(function (v) {
      return Promise.resolve(f);
    });
  };

  return paths(path).filter(_utilsJs.noDotFiles, concurrency).map(function (f) {

    var v = p.join(root, f);

    // debug('Map stat', f)

    return Promise.join(fs.statAsync(v), pathInfo(v, f), function (stat, info) {
      info.size = stat.size;
      info.mtime = stat.mtime.getTime();
      info.lastModified = moment(stat.mtime).format('llll');

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

    //debug('Index %d, page %d, num %d, min %d', index, options.page, options.page * options.limit, (options.page - 1) * options.limit)

    return index >= (options.page - 1) * options.limit && index < options.page * options.limit;
  }, concurrency).map(options.sort !== 'size' ? calcDirectorySize : function (e) {
    return e;
  }).map(function (f) {
    f.humanSize = prettyBytes(f.size);

    return f;
  }, concurrency).then(function (tree) {
    //add parent directory

    var b_root = options.root || root;
    var breadcrumb = options.search ? buildBreadcrumb(b_root) : buildBreadcrumb(b_root, path);

    return Promise.resolve(util._extend({
      tree: tree,
      pages: pages,
      num: num,
      breadcrumb: breadcrumb
    }, options));
  });
};

exports.tree = tree;