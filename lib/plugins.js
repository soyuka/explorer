import p from 'path'
import Stat from './job/stat.js'
import util from 'util'

let debug = require('debug')('explorer:plugins')

function registerPlugins(app) {
  let config = app.get('config')
  let plugins = app.get('plugins')

  if(plugins) {
    debug('Plugins already registered')
    return; 
  }

  plugins = {}

  for(var i in config.plugins) {
    let name = config.plugins[i]
    let item = p.join(config.plugin_path, name)

    try {
      debug('Requiring plugin %s', name)
      plugins[name] = require(item) 

      if('router' in plugins[name]) {
        debug('Calling router for plugin %s', name)
        plugins[name].router(app) 
      }
    } catch(e) {
      console.error('Could not require %s', item)
      if(config.dev)
        console.error(e.stack)
    }
  
    app.set('plugins', plugins) 
  }

}

export {registerPlugins}
