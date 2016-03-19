'use strict';
var p = require('path')
var mm = require('micromatch')
var fs = require('fs')
var HTTPError = require('../lib/errors/HTTPError.js')
var sort = require('../lib/sort.js')

var sort = require('../lib/sort.js')
var utils = require('../lib/utils.js')

var debug = require('debug')('explorer:middlewares:prepareTree')

/**
 * Prepare tree locals et validate queries 
 * @param Express app
 * @return function 
 */
function prepareTree(app) {
  var config = app.get('config')
  var cache = app.get('cache')

  return function(req, res, next) {
    //should be an app.param
    if(!req.query.page || req.query.page < 0)
      req.query.page = 1

    req.query.page = parseInt(req.query.page)

    if(req.query.sort) {
      if(!sort.hasOwnProperty(req.query.sort)) {
        req.query.sort = 'name' 
      }
    }

    if(!~['asc', 'desc'].indexOf(req.query.order)) {
      req.query.order = 'asc' 
    }

    if(!req.query.path)
      req.query.path = './'

    res.locals = {
      search: req.query.search,
      sort: req.query.sort || 'name',
      order: req.query.order,
      page: req.query.page,
      root: p.resolve(req.user.home),
      path: utils.higherPath(req.user.home, req.query.path),
      parent: utils.higherPath(req.user.home, p.resolve(req.query.path, '..')),
      limit: req.query.limit || config.pagination.limit
    }

    req.query.path = res.locals.path

    var opts = utils.extend({}, res.locals, config.tree)

    //@TODO refactor this:
    //- remove as a plugin
    //- archive and upload should parse their own config
    ;['remove', 'archive', 'upload'].forEach(function(e) {
      opts[e] = config[e]

      var k = e == 'remove' ? 'trash' : e

      if(req.user[k] && req.user[k] != '' && req.user[k] != req.user.home) {
        opts[e].path = p.resolve(req.user.home, req.user[k])
      }
    })

    if(!!req.user.readonly === true || opts.remove.disabled || opts.path == opts.remove.trash) {
      res.locals.canRemove = false 
    } else {
      res.locals.canRemove = config.remove && config.remove.method ? true : false
    }

    if(res.locals.sort && res.locals.sort in sort)
      opts.sortMethod = sort[res.locals.sort](opts)

    if(req.query.limit) {
      opts.limit = !!parseInt(req.query.limit) ? req.query.limit : opts.limit
    }

    if(req.user.ignore) {
      
      let index = req.user.ignore.indexOf('*')

      if(~index)
        req.user.ignore.splice(index, 1)

      if(mm.contains(opts.path, req.user.ignore))
        return next(new HTTPError('Forbidden', 403)) 

      opts.skip = function(v) {
        return !mm.any(v, req.user.ignore)
      } 
    }

    if(opts.cache === true) {
      opts.cache = {
        time: cache('tree:time'),
        size: cache('tree:size')
      }
    }

    opts.locals = res.locals
    req.options = opts

    //forcing accept header to rss
    if(req.query.rss && req.query.rss == 1) {
      req.headers['accept'] = 'application/rss+xml'
    }

    debug('Options: \n%o', opts)

    return next()
  }
}

module.exports = prepareTree
