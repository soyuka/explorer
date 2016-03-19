'use strict';
/**
 * HTTPError
 * @param string message
 * @param code int HTTP Code
 */
function HTTPError(message, code) {

  this.name = 'HTTPError - ' 
  this.message = message || ''
  this.stack = (new Error(message)).stack
  this.code = code || 500
}

module.exports = HTTPError
