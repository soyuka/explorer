import p from 'path'
import mm from 'minimatch'

import {sort} from '../lib/sort.js'
import {extend, buildUrl, secureString, higherPath, handleSystemError} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'

let debug = require('debug')('explorer:middlewares')
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
      buildUrl: buildUrl
    })

    req.options = extend(
      res.locals,
      config.tree, 
      config.pagination,
      {remove: config.remove},
      {archive: config.archive}
    )

    if(req.user.trash) {
      req.options.remove.trash = p.resolve(req.user.home, req.user.trash)
    }

    if(!!req.user.readonly === true || req.options.path == req.options.remove.trash) {
      res.locals.canRemove = false 
    } else {
      res.locals.canRemove = config.remove && config.remove.method ? true : false
    }

    if(req.user.archive) {
      req.options.archive.temp = p.resolve(req.user.home, req.user.archive)
    }

    if(res.locals.sort)
      req.options.sortMethod = sort[res.locals.sort](req.options)

    if(req.query.limit) {
      req.options.limit = !!parseInt(req.query.limit) ? req.query.limit : req.options.limit
    }

    if(req.user.ignore) {

      for(let i in req.user.ignore) {
        if(mm(req.options.path, req.user.ignore[i])) {
          return next(new HTTPError('Forbidden', 403)) 
        }
      }

      req.options.skip = function(v) {
        for(let i in req.user.ignore)  {
          if(mm(v, req.user.ignore[i])) {
            return false 
          }
        }

        return true
      } 
    }

    if(parseInt(req.cookies.compressOnFly) == req.cookies.compressOnFly) {
      req.options.compressOnFly = !!parseInt(req.cookies.compressOnFly)
    } else {
      req.options.compressOnFly = true 
    }

    debug('Options: %o', req.options)

    return next()
  }
}


export {prepareTree}
