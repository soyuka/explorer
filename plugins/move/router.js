'use strict';
var Promise = require( 'bluebird')
var fs = require('fs')
var p = require('path')
var extend = require('util')._extend
var debug = require('debug')('explorer:move')
var Notify = require('../../lib/job/notify.js')
var mv = Promise.promisify(require('mv'))
var cpr = Promise.promisify(require('cpr'))

function getData(paths, directories, method) {
  var data = []

  for(var i in paths) {
    data.push({method: method, path: paths[i], directory: false}) 
  }

  for(var i in directories) {
    data.push({method: method, path: directories[i], directory: true}) 
  }

  return data
}

/**
 * @param array items 
 * @param string dest 
 * @return Array Promises cpr
 */
function copyPromises(items, dest) {
  let copy = items.filter(e => e.method == 'copy')
  .map(function(e) {
    e.dest = dest 
    e.future = p.join(dest, p.basename(e.path))

    if(e.directory) {
      e.dest = e.future
    }

    let exists = false

    try {
      exists = !fs.accessSync(e.future) 
    } catch(e) {
    }

    if(exists) {
      return Promise.reject(new Error(e.dest + ' exists'))
    }

    debug('Copy %s to %s', e.path, e.dest)

    return cpr(e.path, e.dest, {
      deleteFirst: false,
      overwrite: false,
      confirm: false
    })
  })

  return copy
}

/**
 * @param array items 
 * @param string dest 
 * @return Array Promises mv
 */
function cutPromises(items, dest) {
  let cut = items.filter(e => e.method == 'cut')
  .map(function(e) {
    e.dest = p.join(dest, p.basename(e.path))

    let exists = false

    try {
      exists = !fs.accessSync(e.dest) 
    } catch(e) {}

    if(exists) {
      return Promise.reject(new Error(e.dest + ' exists'))
    }

    debug('Move %s to %s', e.path, e.dest)

    return mv(e.path, e.dest, {mkdirp: true})
  })

  return cut
}

var Move = function(router, utils, config) {

  var memory = new Notify('clipboard', utils.cache)

  /**
   * @api {post} /p/move/action/copy Copy
   * @apiName copy
   * @apiGroup Plugins
   * @apiUse Action
   * @apiSuccess (201) {Object} Created
   */
  router.post('/action/copy', function(req, res, next) {
    let data = getData(req.options.paths, req.options.directories, 'copy')

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
    let data = getData(req.options.paths, req.options.directories, 'cut')

    debug('Cut paths %o', data)

    return memory.add(req.user.username, data)
    .then(function() {
      return res.handle('back', {info: 'Cut'}, 201)
    })
  })

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

    if(!Array.isArray(req.body.path))
      req.body.path = [req.body.path]

    let dest = req.options.path

    //get items method/path
    let items = req.body.path.map(function(e) {
      let isCopy = /^copy\-/.test(e)
      let isCut = /^cut\-/.test(e)
      let word = isCopy ? 'copy' : 'cut'

      if(!isCut && !isCopy)
        return null

      return {
        method: word, 
        path: e.replace(word+'-', '')
      } 
    }).filter(e => e != null)

    debug('Paste items %o', items)

    return memory.get(req.user.username)
    .then(function(oldclipboard) {
      //get items that matches from clipboard
      let clipboard = oldclipboard.filter(function(e) {
        let exist = items.find(f => e.path == f.path && e.method == f.method)
        return exist
      })

      let newclipboard = oldclipboard.filter(function(e) {
        let exist = items.find(f => e.path == f.path && e.method == f.method)
        return !exist
      })

      debug('Processing items %o', clipboard)

      if(clipboard.length == 0) {
        return res.handle('back', {error: 'Nothing found in the clipboard'}, 404)
      }

      return Promise.all([].concat(
        copyPromises(clipboard, dest),
        cutPromises(clipboard, dest)
      ))
      .then(function() {
        //remove memory items and add them back
        return memory.remove(req.user.username)
      })
      .then(function() {
        return memory.add(req.user.username, newclipboard) 
      })
    })
    .then(function() {
      return res.handle('back', {info: 'Done!'}, 200)
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
