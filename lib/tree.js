import p from 'path'
import Promise from 'bluebird'
import prettyBytes from 'pretty-bytes'
import util from 'util'
import moment from 'moment'
import {noDotFiles, pathInfo} from './utils.js'

let debug = require('debug')('explorer:tree')
let fs = Promise.promisifyAll(require('fs'))

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

  options = util._extend({filter: noDotFiles, maxDepth: 10, concurrency: 100, skip: function() {}}, options)

  let filePath = p.resolve(root.path, file)
  let depth = file.split(p.sep).length

  if(root.depth < depth)
    root.depth = depth

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

    if(err.code !== 'ENOENT') {
      console.error('Failed reading stat', err)
      return Promise.reject(err)
    }

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
  else
    throw new TypeError('Path must be defined')
}

/**
 * @param string path
 * @param object options
 *   - int page (0) - the current page
 *   - int maxDepth (10) - max depth for directory size computation
 *   - int limit (100)
 *   - int concurrency (100)
 * @return Promise
 * @catchable
 */
let tree = function(path, options) {
  
  if(!options) { options = {} }

  options.page = parseInt(options.page) || 1
  options.limit = parseInt(options.limit) || 100
  options.skip = options.skip ? options.skip : function(v) { return true; }

  debug('Tree for path', path)

  let pages = 0
  let concurrency = {concurrency: options.concurrency || 100}
  let root = util.isArray(path) ? options.root : path
  let num = 0

  let calcDirectorySize = function(f) {

    if(f.ext !== 'app' && f.directory !== true) {
      return Promise.resolve(f) 
    }

    return directorySize('', f, options)
    .then(v => Promise.resolve(f))
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
    f.humanSize = prettyBytes(f.size)

    return f
  }, concurrency)
  .then(function(tree) {
    //add parent directory
    let b_root = options.root || root
    let breadcrumb = options.search ? buildBreadcrumb(b_root) : buildBreadcrumb(b_root, path)

    return Promise.resolve(util._extend({
      tree: tree, 
      pages: pages,
      num: num,
      breadcrumb: breadcrumb
    }, options)) 
  })
}

export {tree}
