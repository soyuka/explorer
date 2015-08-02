function getError(config) {
  return function error(err, req, res, next) {

    if(!err) {
      err = new HTTPError('Not Found', 404, '/')
    }

    let d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

    if(!config.quiet)
      if(config.dev)
        console.error(d, err.stack);
      else
        console.error(d, err.code + ' - ' + err.message)

    return res.format({
      'text/plain': function() {
        return res.status(err.code).send(err.message).end()
      },
      'text/html': function() {
        req.flash('error', err.message)
         
        return res.redirect(err.redirect)
      },
      'application/json': function() {
        return res.status(err.code).json(err).end()
      },
      'default': function() {
        return res.status(406).send('Not acceptable')
      }
    })
  }
}

export {getError}
