'use strict';
var Promise = require( 'bluebird')
var fs = require('fs')
var p = require('path')
var extend = require('util')._extend
var debug = require('debug')('explorer:move')
var Notify = require('../../lib/job/notify.js')
var resolveSources = require('../../lib/resolveSources.js')
var Clipboard = require('./clipboard.js')

var Move = function(router, job, utils, config) {

  let memory = new Notify('clipboard', utils.cache)
  let clipboard = new Clipboard(memory)
  let HTTPError = utils.HTTPError
  let removeRoute = require('./removeRoute.js')(HTTPError, resolveSources, job)

  /**
   * @api {post} /p/move/action/copy Copy
   * @apiName copy
   * @apiGroup Plugins
   * @apiUse Action
   * @apiSuccess (201) {Object} Created
   */
  router.post('/action/copy', function(req, res, next) {
    let data = clipboard.parseActionData(req.options, 'copy')

    debug('Copy paths %o', data)

    return memory.add(req.user.username, data)
    .then(function() {
      return res.handle('back', {info: 'Copy'}, 201)
    })
  })

  /**
   * @api {post} /p/move/action/cut Cut
   * @apiName cut
   * @apiGroup Plugins
   * @apiUse Action
   * @apiSuccess (201) {Object} Created
   */
  router.post('/action/cut', function(req, res, next) {
    let data = clipboard.parseActionData(req.options, 'cut')

    debug('Cut paths %o', data)

    return memory.add(req.user.username, data)
    .then(function() {
      return res.handle('back', {info: 'Cut'}, 201)
    })
  })

  /**
   * @api {post} /p/move/action/remove Remove
   * @apiName remove
   * @apiGroup Plugins
   * @apiUse Action
   * @apiSuccess (201) {Object} Created
   */
  router.post('/action/remove', removeRoute)

  /**
   * @api {get} /p/move/clean Clean Clipboard
   * @apiName cleanClipboard
   * @apiGroup Plugins
   */
  router.get('/clean', function(req, res, next) {
    return memory.remove(req.user.username)
    .then(function() {
      return res.handle('back', {info: 'Clipboard emptied'}) 
    })
  })

  /**
   * @api {get} /p/move Get Clipboard
   * @apiName getClipboard
   * @apiGroup Plugins
   * @apiSuccess (200) {Array} Notifications
   */
  router.get('/', function(req, res, next) {
    memory.get(req.user.username)
    .then(function(data) {
      data = data == null ? [] : data
      return res.json(data)
    })
  })

  /**
   * @api {post} /p/move Process Clipboard (paste)
   * @apiName processClipboard
   * @apiGroup Plugins
   * @apiParam {string[]} paths Array of paths and directories prefixed by cut- or copy-
   * @apiError (404) {Object} Nothing to paste or is not in the clipboard
   * @apiError (400) {Object} Bad request, file already exists in most cases
   */
  router.post('/', utils.prepareTree, function(req, res, next) {
    if(!req.body.path)
      return res.handle('back', {error: 'Nothing to paste'}, 404)

    var dest = req.options.path

    clipboard.parseFormData(req.body.path, req.user.username)
    .then(function(data) {
      if(data.length == 0) {
        return res.handle('back', {error: 'Nothing found in the clipboard'}, 404)
      }

      let copyClipboard = clipboard.toSources(data, 'copy')

      resolveSources(copyClipboard, req.options)
      .then(sources => {
        if(sources.length) {
          debug('Copy sources', sources)
          job.call('copy', req.user, sources, dest)
        }
      })

      job.once('move:copied', (username, sources) => {
        clipboard.update(copyClipboard, 'copy', username)
      })

      let moveClipboard = clipboard.toSources(data, 'cut')

      resolveSources(moveClipboard, req.options)
      .then(sources => {
        if(sources.length) {
          debug('Move sources', sources)
          job.call('move', req.user, sources, dest)
        }
      })

      job.once('move:moved', (username, sources) => {
        clipboard.update(moveClipboard, 'cut', username)
      })

      return res.handle('back', {}, 201)
    })
    .catch(function(err) {
      if(config.dev)
        console.error(err.stack);

      return res.handle('back', {error: err.message}, 400) 
    })
  }) 

  return router
}

module.exports = Move
