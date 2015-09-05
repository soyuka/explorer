import {tree} from '../lib/tree.js'
import prettyBytes from 'pretty-bytes'
import p from 'path'
import {handleSystemError} from '../lib/utils.js'
let debug = require('debug')('explorer:trashSize')

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

    let v = config.remove.path

    if(req.user.trash) {
      v = p.resolve(req.user.home, req.user.trash)
    }

    tree(v, {maxDepth: 1})
    .then(function(tree) {

      if(tree.tree.length == 0) {
        return next()
      }
        
      let size = 0;

      for(var i in tree.tree) {
        size += tree.tree[i].size
      }

      debug('Trash size %s', size)

      res.locals.trashSize = prettyBytes(size)

      return next()
    })
    .catch(handleSystemError(next))
  }
}

export default trashSize
