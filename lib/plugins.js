import p from 'path'
import fs from 'fs'
import {Router} from 'express'
import Stat from './job/stat.js'
import util from 'util'
import {prepareTree} from '../middlewares'
import HTTPError from './HTTPError.js'
import {tree} from './tree.js'
import interactor from './job/interactor.js'

let debug = require('debug')('explorer:plugins')

/**
 * registerPlugins
 * require plugin and call router if it exists
 * called in server.js
 * @see plugins documentation
 * @param Express app
 * @return void sets plugins app.set('plugins')
 */
function registerPlugins(app) {

  let config = app.get('config')
  let plugins = {}

  for(var name in config.plugins) {
    let e = config.plugins[name]

    let item = p.join(config.plugin_path, name) 

    try {
      if(e.module) {
        item = p.dirname(require.resolve(e.module))
      }

      debug('Requiring plugin %s', name)
      plugins[name] = util._extend(require(item), {path: item})

    } catch(e) {

      console.error('Could not require %s', item)

      if(config.dev)
        console.error(e.stack)
    }
  
  }

  app.set('plugins', plugins)
}

function registerPluginsRoutes(app) {

  let config = app.get('config')
  let plugins = app.get('plugins')
  let allowKeyAccess = config.allowKeyAccess

  for(let name in plugins) {

    let route = p.join('/p/', name)

    //move this to another file + require after req.format 
    if('router' in plugins[name]) {

      let router = new Router()

      router = plugins[name].router(router, {
        prepareTree: prepareTree(app),
        HTTPError: HTTPError,
        interactor: interactor,
        tree: tree
      }, config)

      debug('Using router for plugin %s on /p/%s', name, name)

      try {
        app.use(route, router) 
      } catch(e) {
        console.error('Can not use router for plugin %s!', name) 

        if(config.dev) {
          console.log(e.stack); 
        }
      }
    }

    let views_path = p.join(plugins[name].path, 'views')

    try {
      fs.accessSync(views_path)

      //Adding views directory
      let views = app.get('views')
      views.push(views_path)
      app.set('views', views)
    } catch(e) {
      console.error('No views for plugin %s (%s)', name, views_path)
    }

    if(!('allowKeyAccess' in plugins[name])) {
      continue; 
    } else if(!util.isArray(plugins[name].allowKeyAccess)) {
      console.error('allowKeyAccess must be an array') 
      continue;
    }
    
    allowKeyAccess = allowKeyAccess.concat(plugins[name].allowKeyAccess.map(function(e) {
      return p.join(route, e)
    }))
  }

  config.allowKeyAccess = allowKeyAccess

  app.set('config', config)
}

export {registerPlugins, registerPluginsRoutes}
