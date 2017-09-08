var fs = require('fs')
var express = require('express')
var p = require('path')
var moment = require('moment')
var multer = require('multer')

var debug = require('debug')('explorer:routes:upload')

var Upload = function(app, job, utils, config) {
  
  function canUpload(req, res, next) {
    var opts = req.options.upload

    if(opts.disabled)
      return next(new utils.HTTPError('Unauthorized', 401))

    return next()
  }

  function getUpload(req, res, next) {
    return res.renderBody('upload.haml', req.options)
  }

  /**
   * @api {post} /p/upload/remote Remote Upload
   * @apiGroup Plugins
   * @apiName remoteUpload
   * @apiParam {string} links Links to download
   * @apiSuccess (201) {Object} Created
   */
  function remoteUpload(req, res, next) {
    var links = req.body.links.split('\r\n')

    links = links.filter(function(e) { return e.trim().length > 0 })

    if(links.length > req.options.upload.maxCount) {
      return next(new utils.HTTPError('Max number of files exceeded ('+req.options.upload.maxCount+')', 400))
    }

    if(!links.length) {
      return next(new utils.HTTPError('No links to download', 400)) 
    }

    job.call('create', links, req.user, req.options)

    return res.handle('back', {info: 'Upload launched'}, 201)
  }

  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, req.options.upload.path)
    },
    filename: function (req, file, cb) {

      var original = file.originalname
      var ext = p.extname(original)
      var name = p.basename(original, ext) 

      //rename if exists
      if(fs.existsSync(p.join(req.options.upload.path, original))) {
        original =  name + '-' + Date.now() + ext
      }

      return cb(null, original)
    }
  })

  /**
   * @api {post} /p/upload Upload
   * @apiGroup Plugins
   * @apiName upload
   * @apiParam {string[]} files
   * @apiSuccess (200) {Object} Done
   */
  var upload = multer({storage: storage})

  app.get('/', utils.prepareTree, canUpload, getUpload)

  app.post('/', utils.prepareTree, canUpload, 
    upload.array('files', config.upload.maxCount),
    function(req, res, next) {
      var info = ''

      if(req.files.length == 1) {
        info = req.files[0].originalname + ' uploaded to ' + req.files[0].path
      } else {
        info = req.files.length + ' files uploaded to ' + req.options.upload.path
      }

      return res.handle('upload', {info: info}, 200)
    }
  )

  app.post('/remote', utils.prepareTree, canUpload, remoteUpload)

  return app
}

module.exports = Upload
