'use strict'
var HTTPError = require('../lib/HTTPError.js')

/**
 * Error middleware
 * Last called middlewares
 * Send the formatted error to client with the correct code or redirect
 * @param object config
 * @return function
 */
function getError(config) {
  return function error(err, req, res, next) {

    if(err.name === 'UnauthorizedError')
      return res.status(401).send('Invalid token')

    if(!err) {
      err = new HTTPError('No errors - please report', 500)
    }

    var d = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

    if(!config.quiet)
      if(config.dev)
        console.error(d, err.stack);
      else
        console.error(d, err.code + ' - ' + err.message)

    return res.status(err.code || 500).send({error: err.message})
  }
}

module.exports = getError
