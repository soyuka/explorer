/**
 * HTTPError
 * @param string message
 * @param code int HTTP Code
 * @param string redirect
 */
function HTTPError(message = '', code = 500, redirect = 'back') {

  this.name = 'HTTPError - ' 
  this.message = message
  this.stack = (new Error(message)).stack
  this.code = code
  this.redirect = redirect
}

export default HTTPError
