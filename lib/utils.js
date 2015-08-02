import p from 'path'
import Promise from 'bluebird'
import util from 'util'
import fs from 'fs'
import HTTPError from './HTTPError.js'

let rimraf = Promise.promisify(require('rimraf'))

/**
 * Filter names starting with a dot
 * @param string f
 * @return bool
 */
let noDotFiles = function(f) { 
  return !/^\./.test(p.basename(f)) 
}

/**
 * Secures a string for a command line search
 * strips: ", ', \, &, |, ;, -
 * @param string str
 * @return string
 */
let secureString = function secureString(str) {
  return str.replace(/"|'|\\|&|\||;|-/g, '')
}


/**
 * Get pack the higher available path to avoid unwanted behaviors
 * @param string root - usually req.user.home
 * @param string path - the path we want to go to
 * @return string - the higher path \o/
 */
let higherPath = function(root, path) {

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
 * @param object ...add - is this a corrent doc format ?!
 * @return origin
 */
let extend = function(origin, ...add) {
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
let buildUrl = function(path, search, options) {

  let str = ''
  let first = true

  for(let i in options) {
    if(options[i]) {
      str += first ? '?' : '&'
      str += `${i}=${options[i]}`
      first = false
    }
  }

  if(search) {
    return `/search${str}&search=${search}`
  }

  return `/${str}&path=${p.normalize(path)}`
}

/**
 * Sanitize a string 
 * @see https://github.com/ezseed/watcher/blob/master/parser/movies.js#L27
 * @param string path
 */
let sanitize = function(path) {
  return p.basename(path)
     .replace(p.extname(path), '')
     .replace(new RegExp('-[a-z0-9]+$', 'i'), '') //team name
     .replace(/\-|_|\(|\)/g, ' ') //special chars
     .replace(/([\w\d]{2})\./ig, "$1 ") //Replacing dot with min 2 chars before
     .replace(/\.\.?([\w\d]{2})/ig, " $1")  //same with 2 chars after
     .replace(/part\s?\d{1}/ig, '') //part
     .replace(/\[[a-z0-9]+\]$/i, '')
     .replace(new RegExp(' {2,}', 'g'), ' ') //double space
}

/**
 * firstExistingPath
 * Get back the first path that does exist
 * @param array paths 
 * @return string the founded path
 */
let firstExistingPath = function(paths) {
  for(let i in paths) {
    if(fs.existsSync(paths[i])) 
      return paths[i]
  }

  return false
}

/**
 * Remove directory content with rimraf on each file
 * Skips dot files
 * @param string path
 * @return Promise
 */
let removeDirectoryContent = function(path) {
  return fs.readdirAsync(path)
  .filter(noDotFiles)
  .map(function(filename) {
    return rimraf(p.resolve(path, filename))
  })
}

/**
 * Handles system error, usually a Promise.catch
 * @param function next middleware next
 * @return function called by a Promise.catch
 */
let handleSystemError = function(next) {
   return function(e) {
   
     console.error(e.stack)

     return next(new HTTPError('A server error occur, if this happens again please contact the administrator', 500))
   }  
}

export {noDotFiles, higherPath, extend, buildUrl, sanitize, secureString, firstExistingPath, removeDirectoryContent, handleSystemError}
