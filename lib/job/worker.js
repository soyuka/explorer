'use strict';
const moment = require('moment')
var util = require('util')
var Notify = require('./notify.js')
var p = require('path')
var Promise = require('bluebird')
var BaseWorker = require('relieve').workers.Worker
var interactor

var debug = require('debug')('explorer:interactor')

/**
 * Worker
 * This is used to run job.js and interact with IPC through EventEmitter
 */
function Worker() {
  if(!this instanceof Worker) {
    return new Worker() 
  }

  BaseWorker.call(this)
}

util.inherits(Worker, BaseWorker)


Worker.prototype.register = function(sockets, plugins_cache) {
  var self = this

  this.on('*:notify', function notify(username, data) {
    if(!username) {
      return console.error("Can't notify without a username") 
    }

    let name = this.event.replace(':notify', '')

    if(!plugins_cache[name]) {
      console.error(`No cache for plugin ${name}, does it have a job?`)
      return
    }

    debug('Got a notification for user %s with data %o', username, data)

    plugins_cache[name].add(username, data)
    .then(() => plugins_cache[name].get(username))
    .then(data => {
      setTimeout(function() {
        let d = data.pop()
        d.type = name
        d.fromNow = moment(d.time).fromNow()

        for(let i in sockets) {
          if(sockets[i]) 
            sockets[i].publish('/notify/'+username, d)
        }
      }, 1000)
    })
    .catch(err => {
      console.error(err.message)
    })
  })

  this.task('example').call('create')
}

Worker.prototype.run = function() {
  let stack = []

  for(let task of this.tasks.values()) {
    if(task.running === true) 
      continue

     stack.push(task.start())
  }

  return Promise.all(stack)
}

module.exports = Worker
