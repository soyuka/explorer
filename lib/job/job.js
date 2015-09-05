import assert from 'assert'
import IPCEE from 'ipcee'
import Stat from './stat.js'

let ipc = IPCEE(process)
let debug = require('debug')('explorer:job')
let p = require('path')

let plugins = {}
let args = [].slice.call(process.argv, 2)

//Require plugins fail-safe
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

    plugins[title] = tmp.job(ipc, new Stat(title))

  } catch(e) {
    console.error('Could not require plugin (export a function) %s', title)
    console.error(e.stack) 
    if(plugins[title])
      delete plugins[title]
  }
}

let names = Object.keys(plugins)

/**
 * Transforms something like class.method or method to callable elements
 * @param string element 
 * @return object {method: MethodToBeCalled, items: array of plugins in which we'll call method}
 */
let transformElement = function(element) {

  if(typeof element != 'string') {
    throw new TypeError('Element should be a string (method, or plugin.method)') 
  }

  element = element.split('.')

  let items = element.shift()
  let method = element.shift()

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
let hasMethod = function(job, method) {
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

  let {method, items} = transformElement(element)

  items.forEach(function(e) {
    let job = plugins[e]
  
    if(hasMethod(job, method)) {
      debug('Calling %s.%s', e, method)
      return job[method].apply(job, data)
    } 

    return ipc.send('error', 'Method ' + method + ' is not a valid option')
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
  let {method, items} = transformElement(element)    
  let resp = {}

  items.forEach(function(e) {
    let job = plugins[e]

    if(hasMethod(job, method)) {
      debug('Get %s.%s', e, method)
      resp[e] = job[method].apply(job, data)
    }
  })

  return ipc.send(method+':get', resp)
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
