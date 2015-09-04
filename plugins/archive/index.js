import job from './job.js'
import interactor from '../../lib/job/interactor.js'
import registerHooks from './hooks.js'
import HTTPError from '../../lib/HTTPError.js'
import p from 'path'

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

module.exports = {
  actionMethods: ['download', 'compress'], //security check
  download: function(req, res, next) {
    let data = getData(req)
    data.stream = res

    let archive = new job(null, this.stat)
    return archive.create(data, req.user, req.options)
  },
  compress: function(req, res, next) {
    if(req.options.archive.disabled)
      return next(new HTTPError('Unauthorized', 401))
  
    let data = getData(req)
    data.stream = data.temp
    interactor.ipc.send('call', 'archive.create', data, req.user, req.options)
    return res.handle('back', {info: 'Archive created'}, 201)
  },
  job: job,
  hooks: registerHooks
}
