import p from 'path'
import Stat from './job/stat.js'
import util from 'util'
import {prepareTree} from '../middlewares'
import HTTPError from '../lib/HTTPError.js'
import interactor from '../lib/job/interactor.js'

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
  let plugins = app.get('plugins')

  if(plugins) {
    debug('Plugins already registered')
    return; 
  }

  plugins = {}

  for(var name in config.plugins) {
    let e = config.plugins[name]

    let item = p.join(config.plugin_path, name) 

    if(e.module) {
      item = p.dirname(require.resolve(e.module))
    }

    try {
      debug('Requiring plugin %s', name)
      plugins[name] = util._extend(require(item), {path: item})

      if('router' in plugins[name]) {
        debug('Calling router for plugin %s', name)
        plugins[name].router(app, {
          prepareTree: prepareTree(app),
          HTTPError: HTTPError,
          interactor: interactor
        }) 
      }
    } catch(e) {
      console.error('Could not require %s', item)
      if(config.dev)
        console.error(e.stack)

      if(plugins[name])
        delete plugins[name]
    }
  
    app.set('plugins', plugins) 
  }

}

export {registerPlugins}
