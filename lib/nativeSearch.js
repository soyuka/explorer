'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _utilsJs = require('./utils.js');

var _string_scoreJs = require('./string_score.js');

var debug = require('debug')('explorer:nativeSearch');

/**
 * recursiveSearch
 * search recursively in path, matching paths
 * @param string path
 * @param object memory internal memory to keep data through calls
 * @param object options config.search
 * @return Promise
 */
var recursiveSearch = function recursiveSearch(path, memory, options) {

  return _fs2['default'].readdirAsync(path).filter(_utilsJs.noDotFiles, options.concurrency).each(function (e) {

    e = _path2['default'].join(path, e);

    var depth = e.split(_path2['default'].sep).length;

    return _fs2['default'].statAsync(e).then(function (stat) {

      if (!stat.isDirectory()) {
        return _bluebird2['default'].resolve([e]);
      }

      //it's a directory
      if (depth > options.maxDepth) {
        return _bluebird2['default'].resolve(e);
      }

      return recursiveSearch(e, memory, options);
    });
  }, options.concurrency).then(function (paths) {
    //flatten and filter
    paths = [].concat.apply([], paths).filter(options.matchFilter);

    var l = paths.length;
    var i = 0;

    for (; i < l; i++) {
      memory.paths[memory.i++] = _path2['default'].relative(options.root, _path2['default'].join(path, paths[i]));
    }

    return _bluebird2['default'].resolve();
  });
};

/**
 * match
 * @param string search
 * @param object options config.search
 * @return function
 */
var match = function match(search, options) {
  /**
   * searchFilter through glob (minimatch) or string score
   * @param string path
   * @return boolean
   */
  return function searchMatch(path) {
    if ((0, _minimatch2['default'])(path, search)) {
      return true;
    }

    if ((0, _string_scoreJs.score)((0, _utilsJs.sanitize)(path), search) > options.maxScore) {
      return true;
    }

    return false;
  };
};

/**
 * nativeSearch
 * @param object options
 * @return function
 */
function nativeSearch(options) {

  if (!options) options = {};

  if (!options.search) options.search = {};

  options = _util2['default']._extend({
    concurrency: 100,
    maxDepth: 10,
    maxScore: 0.5
  }, options.search);

  var memory = { paths: [], i: 0, depth: 0 };

  debug('search options %o', options);

  /**
   * Search
   * @param string search
   * @param string path
   * @param string root
   * @return Promise (resolving an array of matching paths)
   */
  return function search(search, path, root) {
    debug('search path %s', path);
    options.matchFilter = match(search, options);
    options.root = root || path;

    return recursiveSearch(path, memory, options).then(function () {
      debug('search results %o', memory.paths);
      return _bluebird2['default'].resolve(memory.paths);
    })['catch'](function (e) {
      console.error(e);
      return _bluebird2['default'].resolve([]);
    });
  };
}

exports.nativeSearch = nativeSearch;