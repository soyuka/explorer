'use strict';
var utils = require('../lib/utils.js')
var fs = require('fs')

/**
 * sanitize Checkboxes is used on an /action request
 * take every paths and set resolved directories, paths acccordingly
 */
function sanitizeCheckboxes(req, res, next) {
  var paths = []
  var directories = []

  if(typeof req.body.path == 'string')
    req.body.path = [req.body.path]

  //validating paths
  for(let i in req.body.path) {
    var path = utils.higherPath(req.options.root, req.body.path[i]) 

    if(path != req.options.root) {
      try {
        var stat = fs.statSync(path)
      } catch(err) {
        return utils.handleSystemError(next)(err)
      }

      if(stat.isDirectory()) {
        directories.push(path)
      } else {
        paths.push(path)
      }
    }
  }

  req.options.directories = directories
  req.options.paths = paths

  return next()
}

module.exports = sanitizeCheckboxes
