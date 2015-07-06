'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _nativeSearchJs = require('./nativeSearch.js');

var Promise = require('bluebird');
var debug = require('debug')('explorer:search');
var eol = require('os').EOL;
var Spawner = require('promise-spawner');

/**
 * Promise-spawner modifier
 * splits the string and returns an array
 * @param string d stdout
 * @return array
 */
var format = function format(d) {
  d = d.toString().split(eol);
  d.pop();

  debug('Data', d);

  return d;
};

var spawner = new Spawner({ out: format });

/**
 * Handles spawn error to resolve without data
 * @param int code
 * @return Promise
 */
function nodata(code) {
  console.error('Searching failed with code 0. Stderr: %o', this.data.err);
  return Promise.resolve(0);
}

var searchMethods = {
  pt: function PlatinumSearcher(options) {
    return function (search, path) {
      return spawner.spawn('pt --nocolor -g \'' + search + '\' -i \'\' .', { cwd: path })['catch'](nodata);
    };
  },
  ack: function ack(options) {
    return function (search, path) {
      return spawner.spawn('ack --nocolor -g -i --flush -s \'' + search + '\' .', { cwd: path })['catch'](nodata);
    };
  },
  find: function find(options) {
    return function (search, path) {
      return spawner.spawn('find . -iname \'' + search + '\' -print 2>/dev/null', { cwd: path })['catch'](nodata);
    };
  },
  mdfind: function mdfind(options) {
    return function (search, path) {
      return spawner.spawn('mdfind -onlyin . \'' + search + '\' | sed "s "$(pwd)"  g"', { cwd: path })['catch'](nodata);
    };
  },
  custom: function custom(options) {
    if (!options || !options.search || !options.search.command) {
      return this.find(options);
    }

    return function (search, path) {
      return spawner.spawn(options.search.command.replace('${search}', search), { cwd: path })['catch'](nodata);
    };
  },
  native: _nativeSearchJs.nativeSearch
};

/**
 * Search methods mapper
 * @param string method
 * @param object options - see custom search command
 * @return function
 */
var searchMethod = function searchMethod(method, options) {

  if (!searchMethods.hasOwnProperty(method)) {
    throw new TypeError('Method ' + method + ' is not available');
  }

  return searchMethods[method](options);
};

exports.searchMethod = searchMethod;