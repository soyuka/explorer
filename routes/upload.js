import fs from 'fs'
import p from 'path'
import moment from 'moment'
import multer from 'multer'

import HTTPError from '../lib/HTTPError.js'
import {prepareTree} from '../middlewares'
import interactor from '../lib/job/interactor.js'
import upload from '../lib/plugins/upload.js'

let debug = require('debug')('explorer:routes:upload')

function getUpload(req, res, next) {
  return res.renderBody('upload', req.options)
}

/**
 * @api {post} /remote-upload Remote Upload
 * @apiGroup Upload
 * @apiName remoteUpload
 * @apiParam {string} links Links to download
 */
function remoteUpload(req, res, next) {
  let links = req.body.links.split('\r\n')

  links = links.filter(function(e) { return e.trim().length > 0 })

  if(links.length > req.options.upload.maxCount) {
    return next(new HTTPError(`Max number of files exceeded (${req.options.upload.maxCount})`, 400))
  }

  interactor.ipc.send('command', 'upload.create', links, req.user, req.options)

  return res.handle('back', {info: 'Upload launched'}, 201)
}

function canUpload(req, res, next) {
  let opts = req.options.upload

  if(opts.disabled)
    return next(new HTTPError('Unauthorized', 401))

  return next()
}

let Upload = function(app) {
  let config = app.get('config')
  let pt = prepareTree(config)

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
   * @api {post} /upload Upload
   * @apiGroup Upload
   * @apiName upload
   * @apiParam {string[]} files
   */
  let upload = multer({storage: storage})

  app.get('/upload', pt, canUpload, getUpload)
  app.post('/upload', pt, canUpload, 
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

  /**
   * @api {post} /remote-upload Remote Upload
   * @apiGroup Upload
   * @apiName remoteUpload
   * @apiParam {string[]} links One link by line
   */
  app.post('/remote-upload', pt, canUpload, remoteUpload)

  return app
}

export {Upload}
