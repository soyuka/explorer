import p from 'path'

let debug = require('debug')('explorer:middlewares:registerHooks')

//Register plugins, should be called just before rendering (after prepareTree)
function registerHooks(app) {

  let plugins = app.get('plugins')
  let config = app.get('config')

  return function(req, res, next) {
    let hooks = {}

    /**
     * @see plugins documentation
     */
    for(let name in plugins) {
      if('hooks' in plugins[name]) {
        debug('Registering hooks for %s', name)
        hooks[name] = plugins[name].hooks(config, p.join('/p', name), req.user) 
      }
    }

    res.locals.hooks = hooks

    debug('Hooks', res.locals.hooks)

    return next()
  }
}

export default registerHooks
