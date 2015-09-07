import fs from 'fs'
import p from 'path'
import mm from 'minimatch'
import util from 'util'
import Promise from 'bluebird'
import {noDotFiles, sanitize} from './utils.js'
import {score} from './string_score.js'

let debug = require('debug')('explorer:nativeSearch')

/**
 * recursiveSearch
 * search recursively in path, matching paths
 * @param string path
 * @param object memory internal memory to keep data through calls
 * @param object options config.search
 * @return Promise
 */
let recursiveSearch = function recursiveSearch(path, memory, options) {

    return fs.readdirAsync(path)
    .filter(noDotFiles, options.concurrency)
    .each(function(e) {

      e = p.join(path, e)

      let depth = e.split(p.sep).length

      return fs.statAsync(e)
      .then(function(stat) {

        if(!stat.isDirectory()) {
          return Promise.resolve([e])
        }

        //it's a directory
        if(depth > options.maxDepth) {
          return Promise.resolve([e]) 
        }

        return recursiveSearch(e, memory, options)
      })
    }, options.concurrency)
    .catch(function(err) {

      if(err.code != 'EACCES' && err.code != 'ENOENT') {
        return Promise.reject(err)
      }

      if(err.code == 'EACCES')
        console.error('No file access (check rights)', path)
      else
        console.error('No file entry (file does not exist ?!)', path)

      return Promise.resolve([])
    })
    .then(function(paths) {
      //flatten and filter
      paths = [].concat.apply([], paths)
        .filter(options.matchFilter)

      let l = paths.length
      let i = 0

      for(;i<l;i++) {
        memory.paths[memory.i++] = p.relative(options.root, p.join(path, paths[i]))
      }

      return Promise.resolve()
    })
}

/**
 * match
 * @param string search
 * @param object options config.search
 * @return function
 */
let match = function(search, options) {
  /**
   * searchFilter through glob (minimatch) or string score
   * @param string path
   * @return boolean
   */
  return function searchMatch(path) {
    if(mm(path, search)) {
      return true 
    }

    if(score(sanitize(path), search) > options.maxScore) {
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
    maxScore: 0.5
  }, options)

  let memory = {paths: [], i: 0, depth: 0}

  debug('search options %o', options)

  /**
   * Search
   * @param string search
   * @param string path
   * @param string root
   * @return Promise (resolving an array of matching paths)
   */
  return function search(search, path, root) {
    debug('search path %s', path, options)
    options.matchFilter = match(search, options)
    options.root = root || path

    return recursiveSearch(path, memory, options)
    .then(function() {
      debug('search results %o', memory.paths)
      return Promise.resolve(memory.paths)
    })
    //badh
    .catch(function(e) {
      console.error(e) 
      return Promise.resolve([])
    })
  }
}

export {nativeSearch}
