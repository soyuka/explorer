'use strict';
var utils = require('../lib/utils.js')
var fs = require('fs')

/**
 * sanitize Checkboxes is used on an /action request
 * take every paths and set resolved directories, paths acccordingly
 */
function sanitizeCheckboxes(req, res, next) {
  var files = []
  var directories = []

  if(typeof req.body.path == 'string')
    req.body.path = [req.body.path]

  if(req.body.path === undefined && req.options.path)
    req.body.path = [req.options.path]

  if(!req.body.path)
    return next()

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
        files.push(path)
      }
    }
  }

  req.options.directories = directories
  req.options.files = files

  return next()
}

module.exports = sanitizeCheckboxes
