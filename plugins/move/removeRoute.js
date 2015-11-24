'use strict'
function getRemoveRoute(HTTPError, resolveSources, job) {
  return function removeRoute(req, res, next) {
    let opts = req.options

    if((!!req.user.readonly) === true || opts.remove.disabled || !~['mv', 'rm'].indexOf(opts.remove.method)) {
      return next(new HTTPError('Unauthorized', 401))
    }

    let paths = req.body.path

    if(!paths)
      paths = opts.path

    if(!Array.isArray(paths))
      paths = [paths]

    for(let i in paths) {
      let path = paths[i]

      if(path === opts.root || path === opts.home) 
        return next(new HTTPError('Forbidden', 403))

      if(opts.remove.method == 'mv' && ~path.indexOf(opts.remove.path)) {
        return next(new HTTPError("You can't delete from your trash, empty it instead", 406))
      }
    }

    if(opts.remove.method == 'rm') {
      job.call('remove', req.user, paths)
    } else {
      resolveSources(opts, opts)
      .then(function(sources) {
        job.call('move', req.user, sources, opts.remove.path)
      })
    }

    return res.handle('back', {}, 201)
  }
}

module.exports = getRemoveRoute
