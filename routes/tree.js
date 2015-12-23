'use strict';
const Promise = require('bluebird')
const p = require('path')
const moment = require('moment')
const utils = require('../lib/utils.js')
const HTTPError = require('../lib/HTTPError.js')
const tree = require('../lib/tree.js')
const searchMethod = require('../lib/search')
const middlewares = require('../middlewares')
const emptyTrash = require('./emptyTrash.js')
const resolveSources = require('../lib/resolveSources.js')
const getRemoveRoute = require('../plugins/move/removeRoute.js')
const debug = require('debug')('explorer:routes:tree')
const fs = Promise.promisifyAll(require('fs'))


/**
 * @apiDefine Action 
 * @apiExample {js} Example usage:
 *     http -f POST / action=archive.download name=something.zip paths=[one,two]
 * @apiParam {string[]} paths Array of paths and directories
 * @apiParam {string} [name="archive-Date.getTime()"] Archive name
 * @apiParam {string} action Download, archive, remove (see plugins docs)
 */

const Tree = function(app, router) {
  const pt = middlewares.prepareTree(app)
  const config = app.get('config')
  const move = app.get('worker').task('move') 
  const plugins = app.get('plugins')

  /**
   * @api {post} / Action path (upload, archive, plugins)
   * @apiGroup Tree
   * @apiUse Action
   * @apiName compress
   */
  router.post('/tree', pt, middlewares.sanitizeCheckboxes, function(req, res, next) {
    if(!req.body.action) {
      return next(new HTTPError("Action is needed", 400))
    }

    let action = req.body.action.split('.')
    let plugin = action.shift()
    let actionName = action.shift()

    if(!(plugin in plugins)) {
      return next(new HTTPError('Plugin '+plugin+' not found', 404))
    }

    //we're on POST /tree, /p/pluginName/action/actionName
    req.url = `${req.url.replace('/tree', '')}/p/${plugin}/action/${actionName}`

    return app._router.handle(req, res, next)
  })

  /**
   * @api {get} / Get the tree
   * @apiGroup Tree
   * @apiName Tree
   * @apiParam {string} path
   * @apiParam {string} sort
   * @apiParam {string} order
   */
  router.get('/tree', pt, function getTree(req, res, next) {
    tree(req.options.path, req.options)
    .then(tree => {
      tree.options = utils.extend(res.locals, tree.options)
      res.handle(tree)
    })
    .catch(function(err) {
      console.error('Error while parsing tree at path: ' + req.options.path) 
      return utils.handleSystemError(next)(err)
    })
  })

  /**
   * @api {get} /search Search according to the configuration method
   * @apiGroup Tree
   * @apiName Search
   * @apiParam {string} search
   */
  router.get('/search', pt, function getSearch(req, res, next) {
    debug('Search %s in %s', req.options.search, req.options.path)
    
    return searchMethod(req.options.search, req.options.path, req.options)
    .then(tree => {
      tree.options = utils.extend(res.locals, tree.options)
      tree.options.search = req.options.search
      res.handle(tree)
    })
    .catch(utils.handleSystemError(next))
  })

  /**
   * @api {get} /download Download path
   * @apiGroup Tree
   * @apiName Download
   * @apiParam {string} path
   */
  router.get('/download', pt, function getDownload(req, res, next) {
    let path = utils.higherPath(req.options.root, req.query.path)

    if(path === req.options.root) {
      return next(new HTTPError('Unauthorized', 401))
    }

    return Promise.join(fs.statAsync(path), utils.pathInfo(path), function(stat, info) {
      if(stat.isDirectory()) {
        return next(new HTTPError('Downloading a directory is not possible', 400)) 
      }
      
      if(~['image', 'text'].indexOf(info.type)) {

        debug('SendFile %o', info)

        let options = {
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
  })

  /**
   * @api {post} /trash Empty trash
   * @apiGroup User
   * @apiName emptyTrash
   */
  router.post('/trash', pt, function emptyUserTrash(req, res, next) {
    return emptyTrash(app, req.options.remove.path)(req, res, next)
  })

  /**
   * @api {get} /remove Deletes or moves a file
   * @apiGroup Tree
   * @apiName Remove
   * @apiParam {string} path
   */
  router.get('/remove', pt, middlewares.sanitizeCheckboxes, getRemoveRoute(HTTPError, resolveSources, move)) 

  return app
}

module.exports = Tree
