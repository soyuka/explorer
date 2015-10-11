'use strict';
var fs = require('fs')
var p = require('path')
var mm = require('micromatch')
var util = require('util')
var Promise = require('bluebird')
var natural = require('natural')
var minimist = require('minimist')
var isGlob = require('is-glob')
var sanitize = require('../utils.js').sanitize
var tree = require('../tree.js')

var debug = require('debug')('explorer:nativeSearch')

/**
 * match
 * @param string search
 * @param object options config.search
 * @return function
 */
var match = function(search, options) {
  /**
   * searchFilter through glob (micromatch) or Jaro Winkler distance
   * @param string path
   * @return boolean
   */
  return function searchMatch(path) {

    var name = path.name

    if(options.filters.exact === true)
      return search == name

    if(path.directory !== true && options.filters.dir === true) {
      return false
    }

    if(search == name)
      return true

    //if search has no uppercased letters, it'll be case insensitive
    var smartcase = !/[A-Z]+/.test(search)

    if(isGlob(search)) {
      return mm(path.path, search.split(' '), {matchBase: true, nocase: smartcase}).length > 0
    }

    if(smartcase) {
      name = name.toLowerCase() 
    }
  
    name = sanitize(name)

    if(natural.JaroWinklerDistance(name, search) > options.maxScore) {
      return true 
    }

    return false
  }
}

/**
 * nativeSearch
 * @param object options
 * @return function
 */
function nativeSearch(options) {

  if(!options)
    options = {}

  if(!options.search)
    options.search = {}
  
  options = util._extend({
    concurrency: 100,
    maxDepth: 10,
    maxScore: 0.65
  }, options)

  var memory = {paths: [], i: 0, depth: 0}

  debug('search options %o', options)

  /**
   * Search
   * @param string search
   * @param string path
   * @param string root
   * @return Promise (resolving an array of matching paths)
   */
  return function search(search, path, root) {
    debug('search %s in path %s (root: %s)', search, path, root)

    if(!(typeof search == 'string'))
      search = ''

    var filters = minimist(search.split(' ').map(function(e) { 
      if(/^-{1}[a-z]{2,}$/gi.test(e)) {
        e = e.replace('-', '--')
      } 
      return e
    }), {boolean: true})

    search = filters._.join(' ')
    delete filters._

    debug('search %s with filters %o', search, filters)

    options.filters = filters
    options.root = root
    options.path = path
    options.recursive = true

    options.searchFilter = match(search, options)

    return tree(path, options)
  }
}

module.exports = nativeSearch
