import rimraf from 'rimraf'
import Promise from 'bluebird'
import p from 'path'
import moment from 'moment'

import {higherPath, extend, removeDirectoryContent, handleSystemError, pathInfo} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'
import {tree} from '../lib/tree.js'
import {searchMethod} from '../lib/search.js'
import {prepareTree, sanitizeCheckboxes} from '../middlewares'
import interactor from '../lib/job/interactor.js'

let debug = require('debug')('explorer:routes:tree')
let fs = Promise.promisifyAll(require('fs'))

/**
 * @api {get} /download Download path
 * @apiGroup Tree
 * @apiName Download
 * @apiParam {string} path
 */
function download(req, res, next) {
  let path = higherPath(req.options.root, req.query.path)

  if(path === req.options.root) {
    return next(new HTTPError('Unauthorized', 401))
  }

  return Promise.join(fs.statAsync(path), pathInfo(path), function(stat, info) {
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
          return handleSystemError(next)(err)
        } 
      })
    }

    debug('Download %o', info)

    return res.download(path, p.basename(path), function(err) {
      if(err) {
        return handleSystemError(next)(err)
      } 
    })
  })
  .catch(function(err) {
    if(err) {
      return handleSystemError(next)(err)
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
    res.locals = extend(res.locals, e)
    return next()
  })
  .catch(function(err) {
    console.error('Error while parsing tree at path: ' + req.options.path) 
    return handleSystemError(next)(err)
  })
}

/**
 * @api {get} /remove Deletes or moves a file
 * @apiGroup Tree
 * @apiName Remove
 * @apiParam {string} path
 */
function deletePath(req, res, next) {

  let opts = req.options
  let path = opts.path

  if(path == opts.root || path == req.user.home) {
    return next(new HTTPError('Forbidden', 403))
  }

  if((!!req.user.readonly) === true || opts.remove.disabled || !~['mv', 'rm'].indexOf(opts.remove.method)) {
    return next(new HTTPError('Unauthorized', 401))
  }

  if(~path.indexOf(opts.remove.path)) {
    return next(new HTTPError('Not acceptable', 406))
  }

  let cb = function(err, newPath) {
    if(err) {
      return handleSystemError(next)(err)
    }

    return res.handle('back', newPath ? {path: newPath, moved: true} : {removed: true})
  }

  if(opts.remove.method == 'rm') {
    debug('Deleting %s', path)
    return rimraf(path, cb)
  } else {
    let t = p.join(opts.remove.path, p.basename(path) + '.' + moment().format('YYYYMMDDHHmmss'))
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
  let config = req.config

  debug('Search %s with %s in %s', req.options.search, config.search.method, req.options.path)

  let method = searchMethod(config.search.method, config.search)
  
  return method(req.options.search, req.options.path, req.options.root)
  .then(function(data) {
    if(config.search.method == 'native') {
      return data 
    } else {
      return tree([].concat.apply([], this.data.out), req.options)
    }
  })
  .then(function(e) {
    res.locals = extend(res.locals, e, {search: req.query.search})
    return next()
  })
  .catch(handleSystemError(next))
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

  let opts = req.options

  if(opts.remove.disabled || opts.remove.method !== 'mv') {
    return handleSystemError(next)('Forbidden', 403)
  }

  if(opts.remove.path == opts.root) {
    return handleSystemError(next)("Won't happend", 417)
  }

  debug('Empty trash %s', opts.remove.path)

  removeDirectoryContent(opts.remove.path)
  .then(function() {
    req.flash('info', 'Trash is now empty!')
    return res.handle('back')
  })
  .catch(handleSystemError(next))
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
  let plugins = app.get('plugins')

  return function(req, res, next) {

    if(!req.body.action) {
      return handleSystemError(next)("Action is needed", 400) 
    }

    let action = req.body.action.split('.')
    let plugin = action.shift()
    let actionName = action.shift()

    if(!(plugin in plugins)) {
      return new HTTPError(`Plugin ${plugin} not found`, 404) 
    }

    //we're on POST /, /p/pluginName/action/actionName
    req.url = p.join(req.url, 'p', plugin, 'action', actionName)

    return app._router.handle(req, res, next)
  }
}

let Tree = function(app) {
  let pt = prepareTree(app)

  app.post('/', pt, sanitizeCheckboxes, treeAction(app))
  app.get('/', pt, getTree, render)
  app.get('/search', pt, search, render)
  app.get('/download', pt, download)
  app.post('/trash', pt, emptyTrash)
  app.get('/remove', pt, deletePath)

  return app
}

export {Tree}
