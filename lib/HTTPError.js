/**
 * HTTPError
 * @param string message
 * @param code int HTTP Code
 * @param string redirect
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function HTTPError() {
  var message = arguments[0] === undefined ? '' : arguments[0];
  var code = arguments[1] === undefined ? 500 : arguments[1];
  var redirect = arguments[2] === undefined ? 'back' : arguments[2];

  this.name = 'HTTPError - ';
  this.message = message;
  this.stack = new Error(message).stack;
  this.code = code;
  this.redirect = redirect;
}

exports['default'] = HTTPError;
module.exports = exports['default'];