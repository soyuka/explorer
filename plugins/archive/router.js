var fs = require('fs')
var p = require('path')
var moment = require('moment')
var multer = require('multer')
var job = require('./job.js')

var debug = require('debug')('explorer:routes:archive')

var Upload = function(router, utils) {
  
  function getData(req) {
    var name = req.body.name || 'archive'+new Date().getTime()
    var temp = p.join(req.options.archive.path || './', name + '.zip')

    return {
      name: name,
      paths: req.options.paths,
      temp: temp,
      directories: req.options.directories,
      root: req.options.root
    }
  }

  router.post('/action/download', function(req, res, next) {
    var data = getData(req)
    data.stream = res

    var archive = new job(null)
    return archive.create(data, req.user, req.options)
  })

  router.post('/action/compress', function(req, res, next) {
    if(req.options.archive.disabled)
      return next(new HTTPError('Unauthorized', 401))
  
    var data = getData(req)
    data.stream = data.temp
    utils.interactor.ipc.send('call', 'archive.create', data, req.user, req.options)
    return res.handle('back', {info: 'Archive created'}, 201)
  })

  return router
}

module.exports = Upload
