let debug = require('debug')('explorer:middlewares:registerHooks')
import {prepareTree} from '../middlewares'
import HTTPError from '../lib/HTTPError.js'
import interactor from '../lib/job/interactor.js'

//Register plugins, should be called just before rendering (after prepareTree)
function registerHooks(app) {

  let plugins = app.get('plugins')
  let config = app.get('config')

  return function(req, res, next) {
    let hooks = {}
    debug(plugins)

    /**
     * @see plugins documentation
     */
    for(let name in plugins) {
      if('hooks' in plugins[name]) {
        debug('Registering hooks for %s', name)
        hooks[name] = plugins[name].hooks(config) 
      }

      //this might be a separated router in the future on /plugin/name to avoid conflicts
      if('router' in plugins[name]) {
        debug('Calling router for plugin %s', name)
        plugins[name].router(app, {
          prepareTree: prepareTree(app),
          HTTPError: HTTPError,
          interactor: interactor
        }) 
      }
    }

    res.locals.hooks = hooks

    debug('Hooks', res.locals.hooks)

    return next()
  }
}

export default registerHooks
