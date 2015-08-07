import fs from 'fs'
import rimraf from 'rimraf'
import p from 'path'
import moment from 'moment'

import {higherPath, extend, removeDirectoryContent, handleSystemError} from '../lib/utils.js'
import nTTPError from '../lib/HTTPError.js'
import {tree} from '../lib/tree.js'
import {searchMethod} from '../lib/search.js'
import {prepareTree} from '../middlewares'
import interactor from '../lib/job/interactor.js'
import Archive from '../lib/plugins/archive.js'

let debug = require('debug')('explorer:routes:tree')

/**
 * @api {post} /compress Compress paths with archiver
 * @apiGroup Tree
 * @apiName compress
 * @apiParam {string[]} zip Array of paths to zip
 * @apiParam {string} [name="archive-Date.getTime()"] Archive name
 * @apiParam {boolean} compressOnFly pipe zip to response if false
 *                                   data will be processed in the background
 *                                   through interactor
 */
function compress(req, res, next) {

  if(req.options.archive.disabled)
    return next(new HTTPError('Unauthorized', 401))

  let paths = []
  let directories = []

  if(typeof req.body.zip == 'string')
    req.body.zip = [req.body.zip]

  //validating paths
  for(let i in req.body.zip) {
    let path = higherPath(req.options.root, req.body.zip[i]) 

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

  let name = req.body.name || 'archive'+new Date().getTime()
  let temp = p.join(req.options.archive.path || './', `${name}.zip`)

  let data = {
    name: name,
    paths: paths,
    temp: temp,
    directories: directories
  }

  if(req.body.compressOnFly !== undefined || !req.options.archive.keep) {
    //this is the streaming magic
    data.stream = res
    let archive = new Archive()
    return archive.create(data, req.user, req.options)
  } else {
    //background job
    data.stream = temp
    interactor.ipc.send('command', 'archive.create', data, req.user, req.options)
    return res.handle('back', {info: 'Archive created'}, 201)
  }

}

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

  return res.download(path, p.basename(path), function(err) {
    if(err) {
      return handleSystemError(next)(err)
    } 
  })
} 

/**
 * @api {get} /download Get the tree
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
    return res.renderBody('tree.haml', e)
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

  debug('Deleting %s', path)

  let cb = function(err, newPath) {
    if(err) {
      return handleSystemError(next)(err)
    }

    return res.handle('back', newPath ? {path: newPath, moved: true} : {removed: true})
  }

  if(opts.remove.method == 'rm') {
    return rimraf(path, cb)
  } else {
    let t = p.join(opts.remove.path, p.basename(path) + '.' + moment().format('YYYYMMDDHHmmss'))
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

  debug('Search with %s', config.search.method, req.options.search)

  searchMethod(config.search.method, config)(req.options.search, req.options.root)
  .then(function(data) {
    data = data ? data : this.data.out
    return tree([].concat.apply([], data), req.options)
  })
  .then(function(e) {
    return res.renderBody('tree.haml', extend(e, {search: req.query.search}))
  })
  .catch(handleSystemError(next))
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

let Tree = function(app) {
  let config = app.get('config')
  let pt = prepareTree(config)

  app.get('/', pt, getTree)
  app.get('/search', pt, search)
  app.get('/download', pt, download)
  app.post('/compress', pt, compress)
  app.post('/trash', pt, emptyTrash)
  app.get('/remove', pt, deletePath)

  return app
}

export {Tree}
