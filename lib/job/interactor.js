'use strict';
var util = require('util')
var Notify = require('./notify.js')
var p = require('path')
var IPCEE = require('ipcee')
var Promise = require('bluebird')
var fork = require('child_process').fork
var EventEmitter = require('events').EventEmitter

var debug = require('debug')('explorer:interactor')
var interactor

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
Interactor.prototype.run = function(plugins, config, cache) {
  if(this.job) {
    throw new ReferenceError("Job is already running with this interactor")
  }

  var self = this

  debug('Forking job with plugins %o', plugins)

  plugins.push(JSON.stringify(config))
  this.job = fork(p.join(__dirname, './job.js'), plugins)
  //remove configuration
  plugins.pop()

  //set up plugins cache
  this.plugins_cache = {}

  for(let i in plugins) {

    try {
      let tmp = require(plugins[i])
      let name = tmp.name

      if(!name) { name = p.basename(plugins[i]) }

      if('job' in tmp)
        this.plugins_cache[name] = new Notify(name, cache)

    } catch(e) {
      console.error('Could not require plugin (export a function) %s', plugins[i])
      if(config.dev)
        console.error(e.stack) 
    }

  }

  this.ipc = IPCEE(this.job, {wildcard: true, delimiter: ':'})

  var events = {
    exit: function(code) {
      debug('Job exit with code %d', code)
      self.ipc.removeListener('exit', events.exit)
      self.ipc.removeListener('error', events.error)
      self.job = null
      self.emit('exit', code)
    },
    error: function(err) {
      console.error('Got job error: %s', err)
      self.emit('error', err)
    }
  }

  this.ipc.addListener('exit', events.exit)
  this.ipc.addListener('error', events.error)

  this.ipc.on('*:notify', function(username, data) {
    
    let name = this.event.replace(':notify', '')

    if(!username) {
      return self.ipc.emit('error', "Can't notify without a username") 
    }

    if(!self.plugins_cache[name]) {
      return self.ipc.emit('error', `No cache for plugin ${name}, does it have a job?`)
    }

    debug('Got a notification for user %s with data %o', username, data)

    self.plugins_cache[name].add(username, data)
    .then(e => self.plugins_cache[name].get(username))
    .then(e => self.ipc.emit(`notify:${username}`, e))
    .catch(err => self.ipc.emit('error', err))
  })

  return new Promise(function(resolve, reject) {
    self.ipc.once('job.start', function(plugins) {
      return resolve(plugins)
    })
  })
}

Interactor.prototype.send = function() {
  return this.ipc.send.apply(this.ipc, arguments)
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

module.exports = interactor
