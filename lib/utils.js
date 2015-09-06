'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _HTTPErrorJs = require('./HTTPError.js');

var _HTTPErrorJs2 = _interopRequireDefault(_HTTPErrorJs);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var rimraf = _bluebird2['default'].promisify(require('rimraf'));

/**
 * Filter names starting with a dot
 * @param string f
 * @return bool
 */
var noDotFiles = function noDotFiles(f) {
  return !/^\./.test(_path2['default'].basename(f));
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

  root = _path2['default'].resolve(root);
  path = _path2['default'].resolve(root, _path2['default'].normalize(path) || './');

  if (path.length < root.length || path.indexOf(root) == -1) {
    path = root;
  }

  return path;
};

/**
 * Just wanted to test ES6 new stuff
 * ... just kidding extend one arg to another instead of only the first one
 * @param object origin
 * @param object ...add
 * @return origin
 */
var extend = function extend(origin) {
  for (var _len = arguments.length, add = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    add[_key - 1] = arguments[_key];
  }

  for (var i in add) {
    origin = _util2['default']._extend(origin, add[i]);
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
      str += '' + i + '=' + options[i];
      first = false;
    }
  }

  if (search) {
    return '/search' + str + '&search=' + search;
  }

  return '/' + str + '&path=' + _path2['default'].normalize(path);
};

/**
 * Sanitize a string 
 * @see https://github.com/ezseed/watcher/blob/master/parser/movies.js#L27
 * @param string path
 */
var sanitize = function sanitize(path) {
  return _path2['default'].basename(path).replace(_path2['default'].extname(path), '').replace(new RegExp('-[a-z0-9]+$', 'i'), '') //team name
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
    if (paths[i] && _fs2['default'].existsSync(paths[i])) {
      return paths[i];
    }
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
  return _fs2['default'].readdirAsync(path).filter(noDotFiles).map(function (filename) {
    return rimraf(_path2['default'].resolve(path, filename));
  });
};

/**
 * Handles system error, usually a Promise.catch
 * @param function next middleware next
 * @return function called by a Promise.catch
 */
var handleSystemError = function handleSystemError(next) {
  return function (e) {

    console.error(e.stack);

    return next(new _HTTPErrorJs2['default']('A server error occur, if this happens again please contact the administrator', 500));
  };
};

/**
 * Handles middlewares in parallel
 */
var parallelMiddlewares = function parallelMiddlewares(middlewares) {
  return function (req, res, next) {
    return _async2['default'].each(middlewares, function (m, cb) {
      return m(req, res, cb);
    }, next);
  };
};

/**
 * Give path informations
 * @param string path
 */
var pathInfo = function pathInfo(path) {

  var filename = _path2['default'].basename(path);

  var o = {
    name: filename,
    ext: _path2['default'].extname(filename),
    dirname: _path2['default'].dirname(path),
    path: path
  };

  var m = _mime2['default'].lookup(o.path).split('/');

  o.type = m[0];

  var filetype = m[1];

  if (~['.zip', '.rar', '.iso', '.tar'].indexOf(o.ext)) {
    o.type = 'archive';
  }

  if (! ~['application', 'video', 'audio', 'image', 'text', 'archive'].indexOf(o.type)) {
    o.type = 'application';
  }

  return _bluebird2['default'].resolve(o);
};

exports.noDotFiles = noDotFiles;
exports.higherPath = higherPath;
exports.extend = extend;
exports.buildUrl = buildUrl;
exports.sanitize = sanitize;
exports.secureString = secureString;
exports.firstExistingPath = firstExistingPath;
exports.removeDirectoryContent = removeDirectoryContent;
exports.handleSystemError = handleSystemError;
exports.parallelMiddlewares = parallelMiddlewares;
exports.pathInfo = pathInfo;