"use strict";
var rimraf = require('rimraf')
var Promise = require('bluebird')
var p = require('path')
var moment = require('moment')
var utils = require('../lib/utils.js')
var HTTPError = require('../lib/HTTPError.js')
var tree = require('../lib/tree.js')
var searchMethod = require('../lib/search.js')
var middlewares = require('../middlewares')
var interactor = require('../lib/job/interactor.js')

var debug = require('debug')('explorer:routes:tree')
var fs = Promise.promisifyAll(require('fs'))

/**
 * @api {get} /download Download path
 * @apiGroup Tree
 * @apiName Download
 * @apiParam {string} path
 */
function download(req, res, next) {
  var path = utils.higherPath(req.options.root, req.query.path)

  if(path === req.options.root) {
    return next(new HTTPError('Unauthorized', 401))
  }

  return Promise.join(fs.statAsync(path), utils.pathInfo(path), function(stat, info) {
    if(stat.isDirectory()) {
      return next(new HTTPError('Downloading a directory is not possible', 400)) 
    }
    
    if(~['image', 'text'].indexOf(info.type)) {

      debug('SendFile %o', info)

      var options = {
        root: req.options.root,
        maxAge: '5h',
        dotfiles: 'deny',
        lastModified: stat.mtime
      }

      return res.sendFile(p.relative(options.root, path), options, function(err) {
        if(err) {
          return utils.handleSystemError(next)(err)
        } 
      })
    }

    debug('Download %o', info)

    return res.download(path, p.basename(path), function(err) {
      if(err) {
        return utils.handleSystemError(next)(err)
      } 
    })
  })
  .catch(function(err) {
    if(err) {
      return utils.handleSystemError(next)(err)
    } 
  })

} 

/**
 * @api {get} / Get the tree
 * @apiGroup Tree
 * @apiName Tree
 * @apiParam {string} path
 * @apiParam {string} sort
 * @apiParam {string} order
 */
function getTree(req, res, next) {

  debug('Sort by %s %s', req.options.sort, req.options.order)

  tree(req.options.path, req.options)
  .then(function(e) {
    res.locals = utils.extend(res.locals, e)
    return next()
  })
  .catch(function(err) {
    console.error('Error while parsing tree at path: ' + req.options.path) 
    return utils.handleSystemError(next)(err)
  })
}

/**
 * @api {get} /remove Deletes or moves a file
 * @apiGroup Tree
 * @apiName Remove
 * @apiParam {string} path
 */
function deletePath(req, res, next) {

  var opts = req.options
  var path = opts.path

  if(path == opts.root || path == req.user.home) {
    return next(new HTTPError('Forbidden', 403))
  }

  if((!!req.user.readonly) === true || opts.remove.disabled || !~['mv', 'rm'].indexOf(opts.remove.method)) {
    return next(new HTTPError('Unauthorized', 401))
  }

  if(~path.indexOf(opts.remove.path)) {
    return next(new HTTPError("You can't delete from your trash, empty it instead", 406))
  }

  var cb = function(err, newPath) {
    if(err) {
      return utils.handleSystemError(next)(err)
    }

    return res.handle('back', newPath ? {path: newPath, moved: true} : {removed: true})
  }

  if(opts.remove.method == 'rm') {
    debug('Deleting %s', path)
    return rimraf(path, cb)
  } else {
    var t = p.join(opts.remove.path, p.basename(path) + '.' + moment().format('YYYYMMDDHHmmss'))
    debug('Moving %s to %s', path, t)
    return fs.rename(path, t, function(err) {
      return cb(err, t)
    }) 
  }
}

/**
 * @api {get} /search Search according to the configuration method
 * @apiGroup Tree
 * @apiName Search
 * @apiParam {string} search
 */
function search(req, res, next) {
  var config = req.config

  debug('Search %s with %s in %s', req.options.search, config.search.method, req.options.path)

  var method = searchMethod(config.search.method, config.search)
  
  return method(req.options.search, req.options.path, req.options.root)
  .then(function(data) {
    if(config.search.method == 'native') {
      return data 
    } else {
      return tree([].concat.apply([], this.data.out), req.options)
    }
  })
  .then(function(e) {
    res.locals = utils.extend(res.locals, e, {search: req.query.search})
    return next()
  })
  .catch(utils.handleSystemError(next))
}

function render(req, res, next) {
  return res.renderBody('tree.haml')
}

/**
 * @api {post} /trash Empty trash
 * @apiGroup User
 * @apiName emptyTrash
 */
function emptyTrash(req, res, next) {

  var opts = req.options

  if(opts.remove.disabled || opts.remove.method !== 'mv') {
    return utils.handleSystemError(next)('Forbidden', 403)
  }

  if(opts.remove.path == opts.root) {
    return utils.handleSystemError(next)("Won't happend", 417)
  }

  debug('Empty trash %s', opts.remove.path)

  utils.removeDirectoryContent(opts.remove.path)
  .then(function() {
    req.flash('info', 'Trash is now empty!')
    return res.handle('back')
  })
  .catch(utils.handleSystemError(next))
}

/**
 * @api {post} / Action path (upload, archive, plugins)
 * @apiGroup Tree
 * @apiName compress
 * @apiParam {string[]} paths Array of paths and directories
 * @apiParam {string} [name="archive-Date.getTime()"] Archive name
 * @apiParam {string} action Download, archive, remove (see plugins docs)
 */
function treeAction(app) {
  var plugins = app.get('plugins')

  return function(req, res, next) {

    if(!req.body.action) {
      return utils.handleSystemError(next)("Action is needed", 400) 
    }

    var action = req.body.action.split('.')
    var plugin = action.shift()
    var actionName = action.shift()

    if(!(plugin in plugins)) {
      return new HTTPError(`Plugin ${plugin} not found`, 404) 
    }

    //we're on POST /, /p/pluginName/action/actionName
    req.url = p.join(req.url, 'p', plugin, 'action', actionName)

    return app._router.handle(req, res, next)
  }
}

var Tree = function(app) {
  var pt = middlewares.prepareTree(app)

  app.post('/', pt, middlewares.sanitizeCheckboxes, treeAction(app))
  app.get('/', pt, getTree, render)
  app.get('/search', pt, search, render)
  app.get('/download', pt, download)
  app.post('/trash', pt, emptyTrash)
  app.get('/remove', pt, deletePath)

  return app
}

module.exports = Tree
