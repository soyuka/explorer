"use strict";
var assert = require('assert')
var IPCEE = require('ipcee')

var ipc = IPCEE(process, {wildcard: true, delimiter: ':'})
var debug = require('debug')('explorer:job')
var p = require('path')

var plugins = {}
var args = [].slice.call(process.argv, 2)
var config = JSON.parse(args.pop())


//Require plugins jobs fail-safe
for(let i in args) {
  try {

    debug('Require %s', args[i])

    let tmp = require(args[i])
    let title = tmp.name

    if(!title) {
      title = p.basename(args[i]) 
    }
    
    if(plugins[title]) {
      throw new ReferenceError("Plugin " + title + " is already registered")
    }

    if('job' in tmp)
      plugins[title] = tmp.job(ipc)

  } catch(e) {
    console.error('Could not require plugin (export a function) %s', args[i])
    if(config.dev)
      console.error(e.stack) 
  }
}

var names = Object.keys(plugins)

/**
 * Transforms something like class.method or method to callable elements
 * @param string element 
 * @return object {method: MethodToBeCalled, items: array of plugins in which we'll call method, item: if only one}
 */
var transformElement = function(element) {

  if(typeof element != 'string') {
    throw new TypeError('Element should be a string (method, or plugin.method)') 
  }

  element = element.split('.')

  let items = element.shift()
  let method = element.shift()
  let item  = items

  if(!method) {
    method = items
    items = names
    item = false
  } else {
    items = [items] 
  }

  assert(method, 'Must have one "method" argument')

  debug('Got element %o.%s', items, method)

  return {
    method: method,
    items: items,
    item: item
  }
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
ipc.on('call', function(/*element, data...*/) {
  let args = [].slice.call(arguments)
  let element = args.shift()

  let t = transformElement(element)

  t.items.forEach(function(e) {
    let job = plugins[e]
  
    if(hasMethod(job, t.method)) {
      debug('Calling %s.%s', e, t.method)
      return job[t.method].apply(job, args)
    } 

    return ipc.send('error', 'Method ' +t. method + ' is not a valid option')
  })

})

/**
 * Get
 * Like Call but we send data back
 * @example
 * ipc.send('get', 'plugin.method')
 * ipc.once('info
 * @param string element plugin.method or method
 * @param arguments data
 * @return IPCEE.send - plugin:method:get or method:get
 */
ipc.on('get', function(/*element, data...*/) {
  let args = [].slice.call(arguments)
  let element = args.shift()

  let t = transformElement(element)    
  let answer = {}

  t.items.forEach(function(e) {
    let job = plugins[e]

    if(hasMethod(job, t.method)) {
      debug('Get %s.%s', e, t.method)
      answer[e] = job[t.method].apply(job, args)
    }
  })

  let key = [t.method]

  if(t.item) {
    key.unshift(t.item) 
    answer = answer[t.item]
  }

  return ipc.send(key.join(':'), answer)
})

process.on('uncaughtException', function(err) {
  //Temptation would be to send the full Error object
  //but JSON.stringify(new Error('test')) will return '{}'
  //@todo Workaround could be used with new Function() to eval a stringified one
  ipc.send('error', err.toString(), err.stack)

  console.error(err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})

//Send start event with loaded plugins
ipc.send('job.start', Object.keys(plugins))
