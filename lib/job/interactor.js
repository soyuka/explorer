import {spawn, fork} from 'child_process'
import {EventEmitter} from 'events'
import util from 'util'
import p from 'path'
import IPCEE from 'ipcee'
import Promise from 'bluebird'

let debug = require('debug')('explorer:interactor')
let interactor

function Interactor() {

  if(!this instanceof Interactor) {
    return new Interactor() 
  }

  EventEmitter.call(this)

  this.job = null
}

util.inherits(Interactor, EventEmitter)

Interactor.prototype.run = function(plugins) {
  let self = this

  if(this.job) {
    throw new ReferenceError("Job is already running with this interactor")
  }

  debug('Forking job with plugins %o', plugins)
  
  this.job = fork(p.join(__dirname, './container.js'), plugins)

  this.ipc = IPCEE(this.job)

  let events = {
    exit: function(code) {
      debug('Job exit with code %d', code)
      self.ipc.removeListener('exit', events.exit)
      self.ipc.removeListener('error', events.error)
      self.job = null
      self.emit('exit', code)
    },
    error: function(err) {
      console.error('Got error')
      console.error(err)
      self.emit('error', err)
    }
  }

  this.ipc.addListener('exit', events.exit)
  this.ipc.addListener('error', events.error)

  return new Promise(function(resolve, reject) {
    self.ipc.once('job.start', function(plugins) {
      return resolve(plugins)
    })
  })
}

Interactor.prototype.kill = function() {
  this.job.kill()
}

if(!interactor)
  interactor = new Interactor()

export default interactor
