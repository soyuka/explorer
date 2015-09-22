import p from 'path'
import Promise from 'bluebird'
import prettyBytes from 'pretty-bytes'
import util from 'util'
import moment from 'moment'
import {noDotFiles, pathInfo, sha1Hash} from './utils.js'

let debug = require('debug')('explorer:tree')
let fs = Promise.promisifyAll(require('fs'))

/**
 * Build Breadcrumb from paths
 * @param string root
 * @param string path
 * @return array of objects {path, name} where name will be linked to path
 */
let buildBreadcrumb = function(root, path) {
  let breadcrumbs = [{path: root, name: root}]

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
let directorySize = function(file, root, options) {

  let filePath = p.resolve(root.path, file)
  let depth = file.split(p.sep).length

  if(root.depth < depth) {
    root.depth = depth
  }

  if(root.depth >= options.maxDepth) {
    root.depth = Infinity 
    return Promise.resolve(root)
  }

  return fs.statAsync(filePath)
  .then(function(stat) {
    if(stat.isDirectory()) {
      return fs.readdirAsync(filePath)
      .filter(options.filter, {concurrency: options.concurrency})
      .filter(options.skip, {concurrency: options.concurrency})
      .each(v => directorySize(p.join(file, v), root, options))
    } else {
      root.size += stat.size
      return Promise.resolve(root) 
    }
  }) 
  .catch(function(err) {

    if(err.code != 'EACCES' && err.code != 'ENOENT') {
      return Promise.reject(err)
    }

    if(err.code == 'EACCES')
      console.error('No file access (check rights)', filePath)
    else
      console.error('No file entry (file does not exist ?!)', filePath)

    return Promise.resolve(root)
  })
}

/**
 * Handles path argument, readdir if it's a string or return Promise.all
 * @param mixed path
 * @return array Promises
 */
let paths = function(path) {
  if(typeof path === 'string')
    return fs.readdirAsync(path)
  else if(util.isArray(path))
    return Promise.all(path)

  throw new TypeError('Path must be defined')
}

/**
 * @param string path
 * @param object options
 *   - int page (0) - the current page
 *   - int maxDepth (10) - max depth for directory size computation
 *   - int limit (100)
 *   - int concurrency (100)
 *   @see prepareTree
 * @return Promise
 * @catchable
 */
let tree = function(path, options) {
  
  if(!options) { options = {} }

  options.page = parseInt(options.page) || 1
  options.limit = parseInt(options.limit) || 100
  options.maxDepth = parseInt(options.maxDepth) || 10
  options.concurrency = parseInt(options.concurrency) || 100

  options.skip = options.skip ? options.skip : function(v) { return true; }
  options.filter = noDotFiles

  debug('Tree for path %s and options %o', path, options)

  let pages = 0
  let concurrency = {concurrency: options.concurrency}
  let root = util.isArray(path) ? options.root : path
  let num = 0
  let totalSize = 0

  let calcDirectorySize = function(f) {

    let resolver = function() {
      if(options.cache) {
        return Promise.all([
          options.cache.setTime(f.mtime),
          options.cache.setSize(f.size)
        ])
        .then(function() {
          return f
        })
      }

      return f
    }

    if(f.ext !== 'app' && f.directory !== true) {
      return Promise.resolve(f) 
    }

    let hash = sha1Hash(f.path)

    if(options.cache) {
      return options.cache.getTime(hash)
      .then(function(cached) {
        if(cached == f.mtime) {
          return options.cache.getSize(hash)
          .then(function(size) {
            console.log('cache size', f, size)
            f.size = size
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

  return paths(path)
  .filter(noDotFiles, concurrency)
  .filter(options.skip, concurrency)
  .map(function(f) {

    let v = p.join(root, f)

    // debug('Map stat', f)

    return Promise.join(fs.statAsync(v), pathInfo(v), function(stat, info) {
      info.size = stat.size
      info.mtime = stat.mtime.getTime()
      info.lastModified = moment(stat.mtime).format('llll')
      
      // info.atime = stat.atime.getTime()
      // info.lastAccessed = moment(stat.atime).format('llll')
      
      if(stat.isDirectory()) {
        info.directory = true
        info.type = 'directory'
        info.depth = 0
      }

      // debug('info', info)

      return info 
    })
    .catch(function(err) {
      if(err.code === 'ENOENT') {
        console.error('Stat ENOENT', err)
      }
    })
  }, concurrency)
  .filter(options.searchFilter ? options.searchFilter : function(e) { return e })
  .map(options.sort == 'size' ? calcDirectorySize : function(e) { return e })
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
  .map(options.sort !== 'size' ? calcDirectorySize : function(e) { return e })
  .map(function(f) {
    totalSize += f.size
    f.humanSize = prettyBytes(f.size)

    return f
  }, concurrency)
  .then(function(tree) {
    let breadcrumb = buildBreadcrumb(options.root, options.path)

    return util._extend({
      tree: tree, 
      pages: pages,
      size: prettyBytes(totalSize),
      num: num,
      breadcrumb: breadcrumb
    }, options)
  })
}

export {tree}
