"use strict";
var p = require('path')

var debug = require('debug')('explorer:middlewares:registerHooks')

//Register plugins, should be called just before rendering (after prepareTree)
function registerHooks(app) {

  var plugins = app.get('plugins')
  var config = app.get('config')

  return function(req, res, next) {
    var hooks = {}

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

module.exports = registerHooks
