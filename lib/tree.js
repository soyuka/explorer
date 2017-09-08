'use strict';
var p = require('path')
var Promise = require('bluebird')
var prettyBytes = require('pretty-bytes')
var util = require('util')
var moment = require('moment')
var utils = require('./utils.js')

var debug = require('debug')('explorer:tree')
var fs = Promise.promisifyAll(require('fs'))

const DATE_FORMAT = 'llll'

const DEFAULT_STAT = {
  directory: false, 
  type: 'unknown',
  size: 0,
  mtime: 0,
  lastModified: '',
  atime: 0,
  lastAccessed: '',
  ctime: 0,
  lastChanged: '',
  depth: 0
}

var gracefulCatch = function(root, path) {
  return function(err) {

    if(err.code != 'EACCES' && err.code != 'ENOENT') {
      return Promise.reject(err)
    }

    if(err.code == 'EACCES')
      console.error('No file access (check rights on %s)', path)
    else {
      console.error('No file entry (file %s does not exist ?!)', path)
      console.error(err.stack) 
    }

    return Promise.resolve(root)
  }
}

/**
 * Build Breadcrumb from paths
 * @param string root
 * @param string path
 * @return array of objects {path, name} where name will be linked to path
 */
var buildBreadcrumb = function(root, path) {
  var breadcrumbs = [{path: root, name: root}]

  if(!path) {
    return breadcrumbs 
  }

  let paths = path.replace(root, '')
    .split('/')
    .filter(function(v) { return v != '' })

  for(let i in paths) {
    breadcrumbs[parseInt(i)+1] = {
      path: p.join(breadcrumbs[i].path, paths[i]),
      name: paths[i]
    }
  }

  return breadcrumbs
}

/**
 * @param string file
 * @param object root (@see pathInfo)
 * @param object options:
 *   - int maxDepth (10)
 *   - function filter (@see noDotFiles)
 */
var directorySize = function(file, root, options) {

  var path = p.resolve(root.path, file)
  var depth = file.split(p.sep).length

  if(root.depth < depth) {
    root.depth = depth
  }

  if(root.depth >= options.maxDepth) {
    root.depth = Infinity 
    return Promise.resolve(root)
  }

  return fs.statAsync(path)
  .then(function(stat) {
    if(stat.isDirectory()) {
      let items = fs.readdirAsync(path)

      for(let i in options.filters) {
        items = items.filter(options.filters[i]) 
      }

      return items.each(v => directorySize(p.join(file, v), root, options))
    } else {
      root.size += stat.size
      return Promise.resolve(root)
    }
  }) 
  .catch(gracefulCatch(root, path))
}

var recursiveReaddir = function(root, options) {

  let items =  fs.readdirAsync(root)

  for(let i in options.filters)
    items = items.filter(options.filters[i])

  return items.map(function(f) {
    var path = p.join(root, f)

    return fs.statAsync(path)
    .then(function(stat) {
      let depth = root.replace(options.root, '').split(p.sep).length

      if(depth > options.maxDepth)
        return path

      if(stat.isDirectory()) {
        return recursiveReaddir(path, options) 
      }

      return path
    })
    .catch(gracefulCatch(root, path))
  }).then(function(paths) {
    paths.push(root)
    return [].concat.apply([], paths)
  })
}

/**
 * Get directory size through cache
 * @param object options
 * @return function
 */
var getDirectorySize = function(options) {
  var cache = options.cache || false

  /**
   * @param object file (see below)
   * @return Promise
   */
  return function calcDirectorySize(f) {

    if(f.ext !== 'app' && f.directory !== true) {
      return f
    }

    var hash = utils.sha1Hash(f.path)

    var resolver = function() {
      if(cache) {
        return Promise.all([
          cache.time.put(hash, ''+f.mtime, options.cacheTTL),
          cache.size.put(hash, ''+f.size, options.cacheTTL)
        ])
        .then(function() {
          return f
        })
      }

      return f
    }

    if(cache) {
      return cache.time.get(hash)
      .then(function(cached) {
        if(cached == f.mtime) {
          return cache.size.get(hash)
          .then(function(size) {
            f.size = parseInt(size)
            return f
          })
        }

        return directorySize('', f, options)
        .then(resolver)
      })
    }

    return directorySize('', f, options)
    .then(resolver)
  }
}

/**
 * Handles path argument and return filtered paths
 * @param mixed path
 * @param Object options {recursive: boolean}
 * @return array Promises
 */
var paths = function(path, options) {
  let items

  if(typeof path == 'string') {
    if(options.recursive === true) {
      return recursiveReaddir(path, options)
      .map(function(e) {
        return p.relative(path, e) 
      })
    }  
    
    items = fs.readdirAsync(path)
  } else if(Array.isArray(path)) {
    items = Promise.all(path)
  } else {
    throw new TypeError('Path must be an array or a string')
  }

  for(let i in options.filters) {
    items = items.filter(options.filters[i])
  }

  return items
}

function parseIntInfinity(v, def) {
  if(v === Infinity)
    return v

  return parseInt(v) || def
}

/**
 * @param mixed path Array or String
 * @param object options
 *   - int page (0) - the current page
 *   - int maxDepth (10) - max depth for directory size computation
 *   - int limit (100)
 *   - int concurrency (100)
 *   - int cache time to live (seconds)
 *   - function skip path skipping filter
 *   - bool recursive (false) recursive tree from the string path
 *   - sort string (see lib/sort) returning the sortMethod
 *   - function searchFilter (see lib/search)
 *   @see prepareTree
 * @return Promise
 * @catchable
 */
var tree = function(path, options) {
  
  if(!options) { options = {} }

  options.page = parseInt(options.page) || 1
  options.limit = parseIntInfinity(options.limit, 100)
  options.maxDepth = parseIntInfinity(options.maxDepth, 10)
  options.concurrency = parseInt(options.concurrency) || 100
  options.cacheTTL = options.cacheTTL || 86400 //24 hours

  options.filters = [utils.noDotFiles]

  if(options.skip)
    options.filters.push(options.skip)

  debug('Tree for path %s and options %o', path, options)

  var pages = 0
  var concurrency = {concurrency: options.concurrency}
  var num = 0
  var totalSize = 0
  var directorySize = getDirectorySize(options)

  return paths(path, options)
  .map(function(f) {
    if(!Array.isArray(path)) {
      f = p.join(path, f)
    }

    return Promise.join(fs.statAsync(f), utils.pathInfo(f), function(stat, info) {
      info.size = stat.size
      info.mtime = stat.mtime.getTime()
      info.lastModified = moment(stat.mtime).format(DATE_FORMAT)
      
      info.atime = stat.atime.getTime()
      info.lastAccessed = moment(stat.atime).format(DATE_FORMAT)
      
      info.ctime = stat.ctime.getTime()
      info.lastChanged = moment(stat.ctime).format(DATE_FORMAT)

      if(stat.isDirectory()) {
        info.directory = true
        info.depth = 0
        info.type = 'directory'
      }

      // debug('info', info)

      return info 
    })
    .catch(gracefulCatch(DEFAULT_STAT, path))
  }, concurrency)
  .filter(options.searchFilter ? options.searchFilter : function(e) { return e })
  .map(options.sort === 'size' ? directorySize : function(e) { return e })
  .call('sort', options.sortMethod || function() { return; })
  .filter(function(value, index, length) {

    if(!num)
      num = length

    if(!pages)
      pages = Math.ceil(length / options.limit)

    if(options.page == 1) {
      return index < (options.limit * options.page);
    }

    return index >= (options.page - 1) * options.limit && index < options.page * options.limit
  }, concurrency)
  .map(options.sort !== 'size' ? directorySize : function(e) { return e })
  .map(function(f) {
    totalSize += f.size
    f.humanSize = prettyBytes(f.size)

    return f
  }, concurrency)
  .then(function(tree) {
    var breadcrumb = buildBreadcrumb(options.root, options.path)

    return util._extend({
      tree: tree, 
      pages: pages,
      size: prettyBytes(totalSize),
      num: num,
      breadcrumb: breadcrumb
    }, options)
  })
}

module.exports = tree
