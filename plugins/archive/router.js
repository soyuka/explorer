import fs from 'fs'
import p from 'path'
import moment from 'moment'
import multer from 'multer'
import job from './job.js'
import Stat from '../../lib/job/stat.js'

let debug = require('debug')('explorer:routes:archive')

let Upload = function(router, utils) {
  
  function getData(req) {
    let name = req.body.name || 'archive'+new Date().getTime()
    let temp = p.join(req.options.archive.path || './', `${name}.zip`)

    return {
      name: name,
      paths: req.options.paths,
      temp: temp,
      directories: req.options.directories,
      root: req.options.root
    }
  }

  router.post('/action/download', function(req, res, next) {
    let data = getData(req)
    data.stream = res
    let stat = new Stat('archive')

    let archive = new job(null, stat)
    return archive.create(data, req.user, req.options)
  })

  router.post('/action/compress', function(req, res, next) {
    if(req.options.archive.disabled)
      return next(new HTTPError('Unauthorized', 401))
  
    let data = getData(req)
    data.stream = data.temp
    utils.interactor.ipc.send('call', 'archive.create', data, req.user, req.options)
    return res.handle('back', {info: 'Archive created'}, 201)
  })

  return router
}

export default Upload
