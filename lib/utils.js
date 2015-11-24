'use strict';
var p = require('path')
var Promise = require('bluebird')
var util = require('util')
var fs = Promise.promisifyAll(require('fs'))
var HTTPError = require('./HTTPError.js')
var mime = require('mime')
var crypto = require('crypto')

/**
 * Filter names starting with a dot
 * @param string f
 * @return bool
 */
var noDotFiles = function(f) { 
  return !/^\./.test(p.basename(f)) 
}

/**
 * Get pack the higher available path to avoid unwanted behaviors
 * @param string root - usually req.user.home
 * @param string path - the path we want to go to
 * @return string - the higher path \o/
 */
var higherPath = function(root, path) {

  if(!root && typeof root != 'string')
    throw new TypeError('Root is not a string')

  root = p.resolve(root)
  path = p.resolve(root, p.normalize(path) || './')

  if(path.length < root.length || path.indexOf(root) == -1) {
    path = root
  }

  return path
}

/**
 * Just wanted to test ES6 new stuff
 * ... just kidding extend one arg to another instead of only the first one
 * @param object origin
 * @param object ...add
 * @return origin
 */
var extend = function() {
  var add = [].slice.call(arguments)
  var origin = add.shift()

  for(let i in add) {
    origin = util._extend(origin, add[i]) 
  }

  return origin
}

/**
 * Build an URL string from params
 * this is used by the view to generate correct paths according to 
 * the sort, order, pages, search etc.
 * @param string path
 * @param string search
 * @param object options - will be built to a query key=value
 */
var buildUrl = function(path, search, options) {

  var str = ''
  var first = true

  for(let i in options) {
    if(options[i]) {
      str += first ? '?' : '&'
      str += i + '=' + options[i]
      first = false
    }
  }

  if(search) {
    return '/search' + str + '&search=' + search + '&path=' + encodeURIComponent(p.normalize(path))
  }

  return '/' + str + '&path=' + encodeURIComponent(p.normalize(path))
}

/**
 * Sanitize a string 
 * @see https://github.com/ezseed/watcher/blob/master/parser/movies.js#L27
 * @param string path
 */
var sanitize = function(path) {
  return p.basename(path)
     .replace(p.extname(path), '')
     .replace(/\-[a-z0-9]+$/ig, '') //team name
     .replace(/\-|_|\.|\(|\)/g, ' ') //chars separators to space
     .replace(/([\w\d]{2})\./ig, "$1 ") //Replacing dot with min 2 chars before
     .replace(/\.\.?([\w\d]{2})/ig, " $1")  //same with 2 chars after
     .replace(/part\s?\d{1}/ig, '') //part1, part2
     .replace(/\[[a-z0-9]+\]$/i, '') // [something]
     .replace(new RegExp(' {2,}', 'g'), ' ') //double or more spaces
}

/**
 * fs.exists is deprecated
 */
var exists = function(path) {
  return new Promise(function(resolve, reject) {
    fs.access(path, fs.F_OK, function(err) {
      return resolve(err ? false : true)
    })
  })
}

/**
 * fs.existsSync is deprecated
 */
var existsSync = function(path) {
  var exists = false

  try {
    fs.accessSync(path, fs.F_OK)
    exists = true
  } catch(e) {}

  return exists
}

/**
 * firstExistingPath
 * Get back the first path that does exist
 * @param array paths 
 * @return string the founded path
 */
var firstExistingPath = function(paths) {
  for(let i in paths) {
    if(paths[i] && existsSync(paths[i])) {
      return paths[i]
    }
  }

  return false
}

/**
 * Handles system error, usually a Promise.catch
 * @param function next middleware next
 * @return function called by a Promise.catch
 */
var handleSystemError = function(next) {
   return function(e) {
   
     console.error(e.stack)

     return next(new HTTPError('A server error occur, if this happens again please contact the administrator: '+e.message, 500))
   }  
}

/**
 * Give path informations
 * @param string path
 */
var pathInfo = function(path) {

  var filename = p.basename(path) 

  var o = {
    name: filename,
    ext: p.extname(filename),
    dirname: p.dirname(path),
    path: path
  }

  var m = mime.lookup(o.path).split('/')

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
 * create sha1 hash from a string
 * @param string str the string to hash
 * @return string a sha1 hash in hexadecimal
 */
var sha1Hash = function(str) {
  var shasum = crypto.createHash('sha1')

  shasum.update(str, 'utf8')

  return shasum.digest('hex')
}

module.exports = {
  noDotFiles: noDotFiles,
  higherPath: higherPath,
  extend: extend,
  buildUrl: buildUrl,
  sanitize: sanitize,
  firstExistingPath: firstExistingPath,
  handleSystemError: handleSystemError,
  pathInfo: pathInfo,
  sha1Hash: sha1Hash,
  exists: exists,
  existsSync: existsSync
}
