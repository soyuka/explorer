import fs from 'fs'
import p from 'path'
import moment from 'moment'
import multer from 'multer'

// import {higherPath, extend, removeDirectoryContent, handleSystemError} from '../lib/utils.js'
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

  links.filter(function(e) { return e.trim().length > 0 })

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

      let ext = p.extname(file.originalname)
      let n = p.basename(file.originalname, ext) + '-' + Date.now() + ext

      return cb(null, n)
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
  app.post('/upload', pt, canUpload, upload.array('files', 10), getUpload)
  app.post('/remote-upload', pt, canUpload, remoteUpload)

  return app
}

export {Upload}
