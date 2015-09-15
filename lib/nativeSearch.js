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

var _natural = require('natural');

var _natural2 = _interopRequireDefault(_natural);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _treeJs = require('./tree.js');

var debug = require('debug')('explorer:nativeSearch');

/**
 * match
 * @param string search
 * @param object options config.search
 * @return function
 */
var match = function match(search, options) {
  /**
   * searchFilter through glob (minimatch) or Jaro Winkler distance
   * @param string path
   * @return boolean
   */
  return function searchMatch(path) {

    var name = path.name;

    if (path.directory !== true && options.filters.dir === true) {
      return false;
    }

    if ((0, _minimatch2['default'])(path.path, search) || (0, _minimatch2['default'])(path.path, search, { matchBase: true })) {
      return true;
    }

    //if search is uppercased, case insensitive
    if (/[A-Z]+/.test(search)) {
      name = name.toLowerCase();
    }

    name = (0, _utilsJs.sanitize)(name);

    if (_natural2['default'].JaroWinklerDistance(name, search) > options.maxScore) {
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
    maxScore: 0.65
  }, options);

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
    debug('search path %s', path, options);

    var filters = (0, _minimist2['default'])(search.split(' '));

    search = filters._.join(' ');
    delete filters._;

    debug('search %s with filters %o', search, filters);

    options.filters = filters;
    options.root = root;

    options.searchFilter = match(search, options);

    return (0, _treeJs.tree)(path, options);
  };
}

exports.nativeSearch = nativeSearch;