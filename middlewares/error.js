'use strict'
const HTTPError = require('../lib/errors/HTTPError.js')
const ReasonsError = require('../lib/errors/ReasonsError.js')

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
      return res.status(401).send({error: 'Invalid token'})

    if(!err) {
      err = new HTTPError('No errors - please report', 500)
    }

    let code = 500
    let message

    if(err instanceof HTTPError) {
      code = err.code
      message = err.code + ' - ' + err.message 
    } else if(err instanceof ReasonsError) {
      code = 400
      message = err.message.toString()
    } else {
      message = err.message 
    }

    if(!config.quiet) {
      let now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

      console.error(now, message)

      if(config.dev)
        console.error(err.stack)
    }

    return res.status(code).send({error: message})
  }
}

module.exports = getError
