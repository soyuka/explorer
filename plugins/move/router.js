import fs from 'fs'
import mem from './memory.js'

let debug = require('debug')('explorer:routes:archive')

function getData(paths, method) {
  let data = []

  for(let i in paths) {
    data.push({method: method, path: paths[i]}) 
  }

  return data
}

let Move = function(router, utils, config) {

  router.post('/action/copy', function(req, res, next) {

    let paths = [].concat(req.options.paths, req.options.directories)

    mem.add(req.user.username, getData(paths, 'copy'))

    return res.handle('back', {info: 'Copy'}, 201)
  })

  router.post('/action/cut', function(req, res, next) {

    let paths = [].concat(req.options.paths, req.options.directories)

    mem.add(req.user.username, getData(paths, 'cut'))

    return res.handle('back', {info: 'Cut'}, 201)
  })

  return router
}

export default Move
