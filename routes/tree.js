import fs from 'fs'
import rimraf from 'rimraf'
import p from 'path'
import moment from 'moment'

import {higherPath, extend, removeDirectoryContent, handleSystemError} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'
import {tree} from '../lib/tree.js'
import {searchMethod} from '../lib/search.js'
import {prepareTree} from '../middlewares'
import interactor from '../lib/job/interactor.js'
import Archive from '../lib/plugins/archive.js'

let debug = require('debug')('explorer:routes:tree')

/**
 * Compress paths with archiver
 * @route /compress
 */
function compress(req, res, next) {

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
  let temp = p.join(req.options.archive.temp || './', `${name}.zip`)
  let data = {
    name: name,
    paths: paths,
    temp: temp,
    directories: directories,
    options: req.options
  }

  //this is the streaming magic
  if(req.body.compressOnFly !== undefined || !req.options.archive.keep) {
    data.stream = res
    let archive = new Archive()
    return archive.create(data)
  } else {
    data.stream = temp

    interactor.ipc.send('command', 'archive.create', data)

    return res.handle('back', {info: 'Archive created'}, 201)
  }

}

/**
 * @route /download
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
 * Get the tree
 * @route /
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
 * Deletes or moves a file
 */
function deletePath(req, res, next) {

  let path = higherPath(req.options.root, req.query.path)

  debug('Deleting %s', path)

  let cb = function(err, newPath) {
    if(err) {
      return handleSystemError(next)(err)
    }

    return res.handle('back', newPath ? {path: newPath, moved: true} : {removed: true})
  }

  if(path === req.options.root || !!req.user.readonly === true) {
    return next(new HTTPError('Unauthorized', 401))
  }

  if(req.options.remove.method == 'mv') {
    let t = p.join(req.options.remove.trash, p.basename(path) + '.' + moment().format('YYYYMMDDHHmmss'))
    return fs.rename(path, t, function(err) {
      if(err) { 
        return cb(err) 
      } 

      return cb(err, t)
    }) 
  } else if(req.options.remove.method == 'rm') {
    return rimraf(path, cb)
  } else {
    return next(new HTTPError('Forbidden', 403))
  }
}

/**
 * Search through config search method
 * @route /search
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

function emptyTrash(req, res, next) {

  if(!req.options.remove || req.options.remove.method !== 'mv') {
    return handleSystemError(next)('Forbidden', 403)
  }

  if(req.options.remove.trash == req.options.root) {
    return handleSystemError(next)("Won't happend", 417)
  }

  debug('Empty trash %s', req.options.remove.trash)

  removeDirectoryContent(req.options.remove.trash)
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
