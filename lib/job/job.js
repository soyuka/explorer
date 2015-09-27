"use strict";
var assert = require('assert')
var IPCEE = require('ipcee')
var Stat = require('./stat.js')

var ipc = IPCEE(process)
var debug = require('debug')('explorer:job')
var p = require('path')

var plugins = {}
var args = [].slice.call(process.argv, 2)

//Require plugins fail-safe
for(let i in args) {
  try {

    debug('Require %s', args[i])

    var tmp = require(args[i])
    
    var title = tmp.name

    if(!title) {
      title = p.basename(args[i]) 
    }
    
    if(plugins[title]) {
      throw new ReferenceError("Plugin " + title + " is already registered")
    }

    plugins[title] = tmp.job(ipc, new Stat(title))

  } catch(e) {
    console.error('Could not require plugin (export a function) %s', args[i])
    console.error(e.stack) 
  }
}

var names = Object.keys(plugins)

/**
 * Transforms something like class.method or method to callable elements
 * @param string element 
 * @return object {method: MethodToBeCalled, items: array of plugins in which we'll call method}
 */
var transformElement = function(element) {

  if(typeof element != 'string') {
    throw new TypeError('Element should be a string (method, or plugin.method)') 
  }

  element = element.split('.')

  var items = element.shift()
  var method = element.shift()

  if(!method) {
    method = items
    items = names
  } else {
    items = [items] 
  }

  assert(method, 'Must have one "method" argument')

  debug('Got element %o.%s', items, method)

  return {method, items}
}

/**
 * Checks if a plugin has the requested method
 * @param object job the plugin
 * @param string method the method
 * @return boolean
 */
var hasMethod = function(job, method) {
  return job && method in job && typeof job[method] == 'function'
}

/**
 * Command
 * Is used for long jobs, don't expect an answer
 * Example:
 * interactor.ipc.send('call', 'job.method', args...)
 * @param string element plugin.method or method
 * @param arguments ...data
 */
ipc.on('call', function(element, ...data) {

  var t = transformElement(element)

  t.items.forEach(function(e) {
    var job = plugins[e]
  
    if(hasMethod(job, t.method)) {
      debug('Calling %s.%s', e, t.method)
      return job[t.method].apply(job, data)
    } 

    return ipc.send('error', 'Method ' +t. method + ' is not a valid option')
  })

})

/**
 * Get
 * Like Call but we send data back
 * @see Routes.user#deleteNotifications
 * @param string element plugin.method or method
 * @param arguments data
 * @return IPCEE.send - plugin:method:get or method:get
 */
ipc.on('get', function(element, ...data) {
  var t = transformElement(element)    
  var resp = {}

  t.items.forEach(function(e) {
    var job = plugins[e]

    if(hasMethod(job, t.method)) {
      debug('Get %s.%s', e, t.method)
      resp[e] = job[t.method].apply(job, data)
    }
  })

  return ipc.send(t.method+':get', resp)
})

ipc.on('uncaughtException', function(err) {
  //Temptation would be to send the full Error object
  //but JSON.stringify(new Error('test')) will return '{}'
  //@todo Workaround could be used with new Function()
  ipc.send('error', err.toString(), err.stack)

  console.error(err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})

//Send start event with loaded plugins
ipc.send('job.start', Object.keys(plugins))
