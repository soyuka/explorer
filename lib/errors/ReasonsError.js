'use strict';
/**
 * ReasonsError
 * @param array|string message
 */
function ReasonsError(message) {
  this.name = 'ReasonsError - ' 
  this.stack = (new Error(message)).stack
  this.message = message
}

Object.defineProperty(ReasonsError.prototype, "message", {
    get: function() {
      return this._message
    },
    set: function(message) {
      this._message = message 
    },
    toString: function() {
      return this._message.join('\n') 
    }
})

module.exports = ReasonsError
