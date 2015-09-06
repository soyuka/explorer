import p from 'path'
import Stat from './job/stat.js'
import util from 'util'

let debug = require('debug')('explorer:plugins')

/**
 * registerPlugins
 * require plugin and call router if it exists
 * called in server.js
 * @see plugins documentation
 * @param Express app
 * @return void sets plugins app.set('plugins')
 */
function registerPlugins(config) {

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

  return plugins
}

export {registerPlugins}
