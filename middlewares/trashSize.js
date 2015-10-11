'use strict';
var tree = require('../lib/tree.js')
var prettyBytes = require('pretty-bytes')
var p = require('path')
var handleSystemError = require('../lib/utils.js').handleSystemError
var debug = require('debug')('explorer:trashSize')

/**
 * Gets the trash size
 * @param object config
 * @return function
 */
function trashSize(config) {

  return function (req, res, next) {

    res.locals.trashSize = '0 B' 

    if(config.remove.disabled || config.remove.method != 'mv') {
      return next() 
    }

    var v = config.remove.path

    if(req.user.trash) {
      v = p.resolve(req.user.home, req.user.trash)
    }

    tree(v, {maxDepth: 1})
    .then(function(tree) {

      if(tree.tree.length == 0) {
        return next()
      }
        
      var size = 0;

      for(let i in tree.tree) {
        size += tree.tree[i].size
      }

      debug('Trash size %s', size)

      res.locals.trashSize = prettyBytes(size)

      return next()
    })
    .catch(handleSystemError(next))
  }
}

module.exports = trashSize
