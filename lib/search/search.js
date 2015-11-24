'use strict';
var fs = require('fs')
var p = require('path')
var mm = require('micromatch')
var util = require('util')
var Promise = require('bluebird')
var isGlob = require('is-glob')
var sanitize = require('../utils.js').sanitize
var tree = require('../tree.js')
var Filters = require('./filters.js')

var debug = require('debug')('explorer:search')

/**
 * match
 * @param string search
 * @param object options config.search
 * @return function
 */
var match = function(search, options) {
  var filters = options.filters

  /**
   * searchFilter through glob (micromatch) or Jaro Winkler distance
   * @param string path
   * @return boolean
   */
  return function searchMatch(path) {

    let name = path.name

    let result = filters.filter(path, search)

    if(result !== null)
      return result

    if(search == name)
      return true

    //if search has no uppercased letters, it'll be case insensitive
    let smartcase = !/[A-Z]+/.test(search)

    if(isGlob(search)) {
      return mm(path.path, search.split(' '), {matchBase: true, nocase: smartcase}).length > 0
    }

    if(smartcase) {
      name = name.toLowerCase() 
    }
  
    let regexp = new RegExp(search)

    name = sanitize(name)

    if(name.split(' ').some(v => regexp.test(v))) {
      return true 
    }

    return false
  }
}

/**
 * Search
 * @param string search
 * @param string path
 * @param object options
 * @return Promise (resolving an array of matching paths)
 */
function search(search, path, options) {
  if(!options)
    options = {}

  options = util._extend({
    concurrency: 100,
    maxDepth: 10
  }, options)

  debug('search %s in path %s (root: %s)', search, path, options.root)

  if(!(typeof search == 'string'))
    search = '*'

  let filters = new Filters()
  search = filters.parse(search)

  if(!search.trim())
    search = '*'

  debug('search %s', search)

  options.searchFilter = match(search, {
    filters: filters
  })

  let recursive = filters.filters.find(e => e.name == 'recursive' || e.name == 'r')

  options.recursive = recursive ? recursive.value : false

  return tree(path, options)
}

module.exports = search
