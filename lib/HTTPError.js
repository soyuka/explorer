'use strict';
/**
 * HTTPError
 * @param string message
 * @param code int HTTP Code
 * @param string redirect
 */
function HTTPError(message, code, redirect) {

  this.name = 'HTTPError - ' 
  this.message = message || ''
  this.stack = (new Error(message)).stack
  this.code = code || 500
  this.redirect = redirect || 'back'
}

module.exports = HTTPError
