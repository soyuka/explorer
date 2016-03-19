'use strict';
const p = require('path')
const fs = require('fs')
const Router = require('express').Router
const util = require('util')
const existsSync = require('./utils.js').existsSync
const middlewares = require('../middlewares')
const HTTPError = require('./errors/HTTPError.js')
const CallableTask = require('relieve').tasks.CallableTask
const tree = require('./tree.js')
const Notify = require('./job/notify.js')
const Promise = require('bluebird')

const debug = require('debug')('explorer:plugins')

/**
 * registerPlugins
 * require plugin and call router if it exists
 * called in server.js
 * @see plugins documentation
 * @param Express app
 * @return void sets plugins app.set('plugins')
 */
function registerPlugins(app) {

  const config = app.get('config')
  const cache = app.get('cache')
  const plugins = {}
  const plugins_cache = {}

  for(let name in config.plugins) {
    let e = config.plugins[name]

    let item = p.join(config.plugin_path, e.path || name) 
      
    if(e.path)
      item = p.resolve(config.config_path, e.path)

    try {
      if(e.module) {
        item = p.dirname(require.resolve(e.module))
      }

      debug('Requiring plugin %s', name)
      plugins[name] = util._extend(require(item), {path: item})
      plugins_cache[name] = new Notify(name, cache)

    } catch(e) {

      console.error('Could not require %s', item)

      if(config.dev)
        console.error(e.stack)
    }
  }

  app.set('plugins', plugins)
  app.set('plugins_cache', plugins_cache)
}

function registerPluginsRoutes(app, router) {

  const config = app.get('config')
  const plugins = app.get('plugins')
  const cache = app.get('cache')
  const worker = app.get('worker')
  const hooks = {}
  var allowKeyAccess = config.allowKeyAccess

  for(let name in plugins) {

    let route = p.join('/p/', name)

    if('job' in plugins[name]) {
      let task = new CallableTask(p.join(plugins[name].path, 'job.js'), {
        eventemitter: {wildcard: true, delimiter: ':'}
      })

      debug('Using %s Task', name)

      task.name = name 
      task.arguments = [config]
      worker.add(task) 
    }

    //move this to another file + require after req.format 
    if('router' in plugins[name]) {

      let pluginRouter = new Router()

      pluginRouter = plugins[name].router(pluginRouter, worker.task(name), {
        prepareTree: middlewares.prepareTree(app),
        HTTPError: HTTPError,
        tree: tree,
        cache: cache,
        notify: Notify
      }, config)

      debug('Using router for plugin %s on %s', name, route)

      try {
        router.use(route, pluginRouter)
      } catch(e) {
        console.error('Can not use router for plugin %s!', name) 

        if(config.dev) {
          console.error(e.stack); 
        }
      }
    }

    if('hooks' in plugins[name]) {
      debug('Registering hooks for %s', name)
      let pluginHooks = plugins[name].hooks(config, {
        cache: cache,
        notify: Notify
      })

      for(let i in pluginHooks) {
        if(!hooks[i]) { hooks[i] = {} }
        hooks[i][name] = pluginHooks[i]
      }
    }

    let views_path = p.join(plugins[name].path, 'views')

    if(existsSync(views_path)) {
      const views = app.get('views')
      views.push(views_path)
      app.set('views', views)
      debug('Register views for plugin %s (%s)', name, views_path)
    }

    if(!('allowKeyAccess' in plugins[name])) {
      continue; 
    } else if(!Array.isArray(plugins[name].allowKeyAccess)) {
      console.error('allowKeyAccess must be an array') 
      continue
    }
    
    allowKeyAccess = allowKeyAccess.concat(
      plugins[name].allowKeyAccess.map(e => p.join(route, e))
    )
  }

  config.allowKeyAccess = allowKeyAccess

  app.set('config', config)
  app.set('hooks', hooks)
}

module.exports = {
  registerPlugins: registerPlugins,
  registerPluginsRoutes: registerPluginsRoutes
}
