'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var p = require('path');
var Promise = require('bluebird');
var util = require('util');
var fs = require('fs');
var rimraf = Promise.promisify(require('rimraf'));

/**
 * Filter names starting with a dot
 * @param string f
 * @return bool
 */
var noDotFiles = function noDotFiles(f) {
  return !/^\./.test(p.basename(f));
};

/**
 * Secures a string for a command line search
 * strips: ", ', \, &, |, ;, -
 * @param string str
 * @return string
 */
var secureString = function secureString(str) {
  return str.replace(/"|'|\\|&|\||;|-/g, '');
};

/**
 * Get pack the higher available path to avoid unwanted behaviors
 * @param string root - usually req.user.home
 * @param string path - the path we want to go to
 * @return string - the higher path \o/
 */
var higherPath = function higherPath(root, path) {

  if (!root && typeof root != 'string') throw new TypeError('Root is not a string');

  root = p.resolve(root);
  path = p.resolve(root, p.normalize(path) || './');

  if (path.length < root.length || path.indexOf(root) == -1) {
    path = root;
  }

  return path;
};

/**
 * Just wanted to test ES6 new stuff
 * ... just kidding extend one arg to another instead of only the first one
 * @param object origin
 * @param object ...add - is this a corrent doc format ?!
 * @return origin
 */
var extend = function extend(origin) {
  for (var _len = arguments.length, add = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    add[_key - 1] = arguments[_key];
  }

  for (var i in add) {
    origin = util._extend(origin, add[i]);
  }

  return origin;
};

/**
 * Build an URL string from params
 * this is used by the view to generate correct paths according to 
 * the sort, order, pages, search etc.
 * @param string path
 * @param string search
 * @param object options - will be built to a query key=value
 */
var buildUrl = function buildUrl(path, search, options) {

  var str = '';
  var first = true;

  for (var i in options) {
    if (options[i]) {
      str += first ? '?' : '&';
      str += i + '=' + options[i];
      first = false;
    }
  }

  if (search) {
    return '/search' + str + '&search=' + search;
  }

  return '/' + str + '&path=' + p.normalize(path);
};

/**
 * Sanitize a string 
 * @see https://github.com/ezseed/watcher/blob/master/parser/movies.js#L27
 * @param string path
 */
var sanitize = function sanitize(path) {
  return p.basename(path).replace(p.extname(path), '').replace(new RegExp('-[a-z0-9]+$', 'i'), '') //team name
  .replace(/\-|_|\(|\)/g, ' ') //special chars
  .replace(/([\w\d]{2})\./ig, '$1 ') //Replacing dot with min 2 chars before
  .replace(/\.\.?([\w\d]{2})/ig, ' $1') //same with 2 chars after
  .replace(/part\s?\d{1}/ig, '') //part
  .replace(/\[[a-z0-9]+\]$/i, '').replace(new RegExp(' {2,}', 'g'), ' ') //double space
  ;
};

/**
 * firstExistingPath
 * Get back the first path that does exist
 * @param array paths 
 * @return string the founded path
 */
var firstExistingPath = function firstExistingPath(paths) {
  for (var i in paths) {
    if (fs.existsSync(paths[i])) return paths[i];
  }

  return false;
};

/**
 * Remove directory content with rimraf on each file
 * Skips dot files
 * @param string path
 * @return Promise
 */
var removeDirectoryContent = function removeDirectoryContent(path) {
  return fs.readdirAsync(path).filter(noDotFiles).map(function (filename) {
    return rimraf(p.resolve(path, filename));
  });
};

exports.noDotFiles = noDotFiles;
exports.higherPath = higherPath;
exports.extend = extend;
exports.buildUrl = buildUrl;
exports.sanitize = sanitize;
exports.secureString = secureString;
exports.firstExistingPath = firstExistingPath;
exports.removeDirectoryContent = removeDirectoryContent;