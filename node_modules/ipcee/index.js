var assert = require('assert')
var util = require('util')
var EE = require('events').EventEmitter
var debug = require('debug')('IPCEE')

function IPCEE(child_process) {

  if(!(this instanceof IPCEE)) { return new IPCEE(child_process) }

  assert(child_process.hasOwnProperty('send'), 'IPC is not enabled')

  EE.call(this)

  this.client = child_process

  this._hookEvents()

  return this
}

util.inherits(IPCEE, EE)

IPCEE.prototype.send = function() {
 var args = [].slice.call(arguments)

 this.client.send(args)

 return this
}

IPCEE.prototype.onmessage = function(args) {
  if(util.isArray(args)) {
    debug('Received message', args)
    this.emit.apply(this, args)

    return this
  }

  this.emit('message', args)
  return this
}

IPCEE.prototype.onexit = function(code) {
  debug('Process exited with code %d', code)
  this._removeEvents()
  this.emit('exit', code)
  delete this.client
}

IPCEE.prototype._hookEvents = function() {
  this.client.addListener('message', this.onmessage.bind(this))
  this.client.addListener('exit', this.onexit.bind(this))
}

IPCEE.prototype._removeEvents = function() {
  this.client.removeListener('message', this.onmessage.bind(this))
  this.client.removeListener('exit', this.onexit.bind(this))
}

module.exports = IPCEE
