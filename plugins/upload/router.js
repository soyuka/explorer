import fs from 'fs'
import express from 'express'
import p from 'path'
import moment from 'moment'
import multer from 'multer'

let debug = require('debug')('explorer:routes:upload')

let Upload = function(app, utils, config) {
  
  function canUpload(req, res, next) {
    let opts = req.options.upload

    if(opts.disabled)
      return next(new utils.HTTPError('Unauthorized', 401))

    return next()
  }

  function getUpload(req, res, next) {
    return res.renderBody('upload.haml', req.options)
  }

  /**
   * @api {post} /p/upload/remote Remote Upload
   * @apiGroup Upload
   * @apiName remoteUpload
   * @apiParam {string} links Links to download
   */
  function remoteUpload(req, res, next) {
    let links = req.body.links.split('\r\n')

    links = links.filter(function(e) { return e.trim().length > 0 })

    if(links.length > req.options.upload.maxCount) {
      return next(new utils.HTTPError(`Max number of files exceeded (${req.options.upload.maxCount})`, 400))
    }

    utils.interactor.ipc.send('call', 'upload.create', links, req.user, req.options)

    return res.handle('back', {info: 'Upload launched'}, 201)
  }

  let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, req.options.upload.path)
    },
    filename: function (req, file, cb) {

      let original = file.originalname
      let ext = p.extname(original)
      let name = p.basename(original, ext) 

      //rename if exists
      if(fs.existsSync(p.join(req.options.upload.path, original))) {
        original =  name + '-' + Date.now() + ext
      }

      return cb(null, original)
    }
  })

  /**
   * @api {post} /p/upload Upload
   * @apiGroup Upload
   * @apiName upload
   * @apiParam {string[]} files
   */
  let upload = multer({storage: storage})

  app.get('/', utils.prepareTree, canUpload, getUpload)
  app.post('/', utils.prepareTree, canUpload, 
    upload.array('files', config.upload.maxCount),
    function(req, res, next) {
      let info = ''

      if(req.files.length == 1) {
        info = `${req.files[0].originalname} uploaded to ${req.files[0].path}`
      } else {
        info = `${req.files.length} files uploaded to ${req.options.upload.path}`
      }

      return res.handle('upload', {info: info}, 200)
    }
  )

  app.post('/remote', utils.prepareTree, canUpload, remoteUpload)

  return app
}

export default Upload
