import HTTPError from '../lib/HTTPError.js'

/**
 * Error middleware
 * Last called middlewares
 * Send the formatted error to client with the correct code or redirect
 * @param object config
 * @return function
 */
function getError(config) {
  return function error(err, req, res, next) {

    if(!err) {
      err = new HTTPError('No errors - please report', 500, '/')
    }

    let d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

    if(!config.quiet)
      if(config.dev)
        console.error(d, err.stack);
      else
        console.error(d, err.code + ' - ' + err.message)

    return res.format({
      'text/html': function() {
        req.flash('error', err.message)
         
        if(err.redirect)
          return res.redirect(err.redirect)
        else
          return res.send('Too bad :(<br><img src="http://edgecats.net/first" alt="a random cat gif moar" /><br><br>' + err.message)
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

export default getError
