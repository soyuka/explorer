'use strict';

var fs = require('fs')
var p = require('path')
var moment = require('moment')
var multer = require('multer')
var ArchiveJob = require('./job.js')

var debug = require('debug')('explorer:routes:archive')

var Upload = function(router, job, utils, config) {
  
  function getData(req) {
    var name = req.body.name || 'archive'+new Date().getTime()
    var temp = p.join(req.options.archive.path || './', name + '.zip')

    return {
      name: name,
      files: req.options.files,
      temp: temp,
      directories: req.options.directories
    }
  }

  /**
   * @api {post} /p/archive/action/download Download
   * @apiGroup Plugins
   * @apiName download
   * @apiUse Action
   * @apiSuccess {Stream} zip file attachment
   */
  router.post('/action/download', function(req, res, next) {
    var data = getData(req)

    if(data.files == 0 && data.directories == 0) {
      return next(new utils.HTTPError('No files to download', 400)) 
    }

    data.stream = res

    var archive = new ArchiveJob()
    return archive.create(data, req.user, req.options)
  })

  /**
   * @api {post} /p/archive/action/download Compress (zip)
   * @apiGroup Plugins
   * @apiName compress
   * @apiUse Action
   * @apiSuccess (201) {Object} Created
   */
  router.post('/action/compress', function(req, res, next) {
    if(req.options.archive.disabled)
      return next(new utils.HTTPError('Unauthorized', 401))
  
    var data = getData(req)
  
    if(data.files == 0 && data.directories == 0) {
      return next(new utils.HTTPError('No files to compress', 400)) 
    }

    data.stream = data.temp
    job.call('create', data, req.user, req.options)
    return res.handle('back', {info: 'Archive created'}, 201)
  })

  return router
}

module.exports = Upload
