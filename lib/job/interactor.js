import {spawn, fork} from 'child_process'
import {EventEmitter} from 'events'
import util from 'util'
import p from 'path'
import IPCEE from 'ipcee'
import Promise from 'bluebird'

let debug = require('debug')('explorer:interactor')
let interactor

/**
 * Interactor
 * This is used to run job.js and interact with IPC through EventEmitter
 */
function Interactor() {

  if(!this instanceof Interactor) {
    return new Interactor() 
  }

  EventEmitter.call(this)

  this.job = null
}

util.inherits(Interactor, EventEmitter)

/**
 * Run
 * Forks job.js with the plugins
 * Hooks exit, start and error events
 * @param array plugins strings representing a directory in plugin_path
 * @return Promise resolved when job has started
 */
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
      process.nextTick(function() {
        self.emit('exit', code)
      })
    },
    error: function(err) {
      console.error('Got error')
      console.error(err)
      process.nextTick(function() {
        self.emit('error', err)
      })
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

/**
 * Kills the fork
 * @return void
 */
Interactor.prototype.kill = function() {
  this.job.kill()
}

/**
 * Singleton
 */
if(!interactor)
  interactor = new Interactor()

export default interactor
