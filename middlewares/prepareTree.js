import p from 'path'
import mm from 'minimatch'
import fs from 'fs'

import {sort} from '../lib/sort.js'
import {extend, buildUrl, secureString, higherPath, handleSystemError} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'

let debug = require('debug')('explorer:middlewares:prepareTree')
/**
 * Prepare tree locals et validate queries 
 * @param Express app
 * @return function 
 */
function prepareTree(app) {
  let config = app.get('config')
  let plugins = app.get('plugins')

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
      extend: extend,
      hooks: {},
      urlOptions: {
        limit: req.query.limit,
        order: req.query.order,
        sort: req.query.sort,
        page: req.query.page
      }
    })

    ;['remove', 'archive', 'upload'].forEach(function(e) {
      res.locals[e] = config[e]
    })

    /**
     * @see plugins documentation
     */
    for(let i in plugins) {
      if('hooks' in plugins[i]) {
        debug('Registering hooks for %s', i)
        res.locals.hooks[i] = plugins[i].hooks(res.locals) 
      }
    }

    debug('Hooks', res.locals.hooks)

    let opts = extend({},
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

    //forcing accept header to rss
    if(req.query.rss && req.query.rss == 1) {
      req.headers['accept'] = 'application/rss+xml'
    }

    debug('Options: \n%o', opts)

    return next()
  }
}

/**
 * sanitize Checkboxes is used on an /action request
 * take every paths and set resolved directories, paths acccordingly
 */
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
