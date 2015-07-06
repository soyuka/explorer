var p = require('path')
var debug = require('debug')('explorer:tree')
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'))
var mime = require('mime')
var prettyBytes = require('pretty-bytes')
var util = require('util')
var moment = require('moment')
import {noDotFiles} from './utils.js'

var buildBreadcrumb = function(root, path) {
  let breadcrumbs = [{path: root, name: root}]

  if(!path) {
    return breadcrumbs 
  }

  let paths = path.replace(root, '')
    .split('/')
    .filter(function(v) { return v != '' })

  for(var i in paths) {
    breadcrumbs[parseInt(i)+1] = {
      path: p.join(breadcrumbs[i].path, paths[i]),
      name: paths[i]
    }
  }

  return breadcrumbs
}

/**
 * Give path informations
 * @param string path
 * @param string filename
 */
var pathInfo = function(path, filename) {

  let o = {
    name: filename,
    ext: p.extname(filename),
    dirname: p.dirname(path),
    path: path
  }

  let m = mime.lookup(o.path).split('/')

  o.type = m[0]
  
  var filetype = m[1]
  
  if(~['.zip', '.rar', '.iso', '.tar'].indexOf(o.ext)) {
    o.type = 'archive'
  }

  if(!~['application', 'video', 'audio', 'image', 'text', 'archive'].indexOf(o.type)) {
    o.type = 'application'
  }

  return Promise.resolve(o) 
}

/**
 * @param string file
 * @param object root (@see pathInfo)
 * @param object options:
 *   - int maxDepth (10)
 *   - function filter (@see noDotFiles)
 */
var directorySize = function(file, root, options) {

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

var paths = function(path) {
  if(typeof path === 'string')
    return fs.readdirAsync(path)
  else if(util.isArray(path))
    return Promise.all(path)
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
var tree = function(path, options) {
  
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

    return Promise.join(fs.statAsync(v), pathInfo(v, f), function(stat, info) {
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

    //debug('Index %d, page %d, num %d, min %d', index, options.page, options.page * options.limit, (options.page - 1) * options.limit)

    return index >= (options.page - 1) * options.limit && index < options.page * options.limit
  }, concurrency)
  .map(options.sort !== 'size' ? calcDirectorySize : function(e) { return e })
  .map(function(f) {
    f.humanSize = prettyBytes(f.size)

    return f
  }, concurrency)
  .then(function(tree) {
    //add parent directory
    
    var b_root = options.root || root
    var breadcrumb = options.search ? buildBreadcrumb(b_root) : buildBreadcrumb(b_root, path)

    return Promise.resolve(util._extend({
      tree: tree, 
      pages: pages,
      num: num,
      breadcrumb: breadcrumb
    }, options)) 
  })
}

export {tree}
