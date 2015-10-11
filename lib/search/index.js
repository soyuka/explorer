'use strict';
var Promise = require('bluebird')
var Spawner = require('promise-spawner')
var eol = require('os').EOL
var nativeSearch = require('./native.js')

var debug = require('debug')('explorer:search')

/**
 * Promise-spawner modifier
 * splits the string and returns an array
 * @param string d stdout
 * @return array
 */
var format = function formatOutput(d) {
    d = d.toString().split(eol)
    d.pop()

    debug('Data', d)

    return d
  }


var spawner = new Spawner({ out: format })

/**
 * Handles spawn error to resolve without data
 * @param int code
 * @return Promise
 */
var nodata = function catchNoData(code) {
  console.error('Searching failed with code 0. Stderr: %o', this.data.err) 
  return Promise.resolve(0)
}

var searchMethods = {
  pt: function PlatinumSearcher(options) {
    return (search, path) => spawner.spawn("pt --nocolor -g '"+search+"' -i '' .", {cwd: path})
    .catch(nodata)
  },
  ack: function ack(options) {
    return (search, path) => spawner.spawn("ack --nocolor -g -i --flush -s '"+search+"' .", {cwd: path})
    .catch(nodata)
  }, 
  find: function find(options) {
    return (search, path) => spawner.spawn("find . -iname '"+search+"' -print 2>/dev/null", {cwd: path})
    .catch(nodata)
  },
  mdfind: function mdfind(options) {
    return (search, path) => spawner.spawn("mdfind -onlyin . '"+search+"' | sed 's \"$(pwd)\"  g'", {cwd: path})
    .catch(nodata)
  },
  custom: function(options) {
    if(!options || !options.search || !options.search.command) {
      return this.find(options)   
    }

    return (search, path) => spawner.spawn(options.search.command.replace('${search}', search), {cwd: path})
    .catch(nodata)
  },
  native: nativeSearch
}

/**
 * Search methods mapper
 * @param string method
 * @param object options - see custom search command
 * @return function
 */
function searchMethod(method, options) {

  if(!searchMethods.hasOwnProperty(method)) {
    throw new TypeError('Method '+method+' is not available') 
  }

  return searchMethods[method](options)
} 

module.exports = searchMethod
