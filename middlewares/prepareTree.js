import p from 'path'
import mm from 'minimatch'

import {sort} from '../lib/sort.js'
import {extend, buildUrl, secureString, higherPath, handleSystemError} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'

let debug = require('debug')('explorer:middlewares:prepareTree')
/**
 * Prepare tree locals et validate queries 
 * @param config
 * @return function middleware(req, res, next)
 */
function prepareTree(config) {
  return function(req, res, next) {
    //should be an app.param
    if(!req.query.page || req.query.page < 0)
      req.query.page = 1

    req.query.page = parseInt(req.query.page)

    if(req.query.sort) {
      if(!sort.hasOwnProperty(req.query.sort)) {
        req.query.sort = null 
      }
    }

    if(!~['asc', 'desc'].indexOf(req.query.order)) {
      req.query.order = 'asc' 
    }

    if(!req.query.path)
      req.query.path = './'
    
    if(req.query.search && config.search.method !== 'native') {
      req.query.search = secureString(req.query.search)
    }

    res.locals = extend(res.locals, {
      search: req.query.search,
      sort: req.query.sort || '',
      order: req.query.order || '',
      page: req.query.page,
      root: p.resolve(req.user.home),
      path: higherPath(req.user.home, req.query.path),
      parent: higherPath(req.user.home, p.resolve(req.query.path, '..')),
      buildUrl: buildUrl,
    }, {remove: config.remove}, {archive: config.archive}, {upload: config.upload})

    let opts = extend(
      res.locals,
      config.tree, 
      config.pagination
    )

    if(req.user) {
      for(let i in req.user) {
        if (~['remove', 'archive', 'upload'].indexOf(i) && req.user[i] != '' && req.user[i] != req.user.home) {
          opts[i].path = p.resolve(req.user.home, req.user[i])
        }
      }
    }

    if(!!req.user.readonly === true || opts.remove.disabled || opts.path == opts.remove.trash) {
      res.locals.canRemove = false 
    } else {
      res.locals.canRemove = config.remove && config.remove.method ? true : false
    }

    if(res.locals.sort)
      opts.sortMethod = sort[res.locals.sort](opts)

    if(req.query.limit) {
      opts.limit = !!parseInt(req.query.limit) ? req.query.limit : opts.limit
    }

    if(req.user.ignore) {

      for(let i in req.user.ignore) {
        if(mm(opts.path, req.user.ignore[i])) {
          return next(new HTTPError('Forbidden', 403)) 
        }
      }

      opts.skip = function(v) {
        for(let i in req.user.ignore)  {
          if(mm(v, req.user.ignore[i])) {
            return false 
          }
        }

        return true
      } 
    }

    req.options = opts

    debug('Options: \n%o', opts)

    return next()
  }
}

function sanitizeCheckboxes(req, res, next) {
  let paths = []
  let directories = []

  if(typeof req.body.path == 'string')
    req.body.path = [req.body.path]

  //validating paths
  for(let i in req.body.path) {
    let path = higherPath(req.options.root, req.body.path[i]) 

    if(path != req.options.root) {
      try {
        var stat = fs.statSync(path)
      } catch(err) {
        return handleSystemError(next)(err)
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

  next()
}

export {prepareTree, sanitizeCheckboxes}
