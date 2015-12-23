'use strict'
const p = require('path')
const Promise = require('bluebird')
const Notify = require('../lib/job/notify.js')

const debug = require('debug')('explorer:middlewares:registerHooks')

function Hooks(app, router) {

  const plugins = app.get('plugins')
  const config = app.get('config')
  const cache = app.get('cache')

  function getHooks(user) {
    let hooks = {}

    /**
     * @see plugins documentation
     */
    for(let name in plugins) {
      if('hooks' in plugins[name]) {
        debug('Registering hooks for %s', name)
        hooks[name] = plugins[name].hooks(config, user, {
          cache: cache,
          notify: Notify
        })
      }
    }

    return Promise.props(hooks)
  }

  router.get('/hooks/:name', function(req, res, next) {
    getHooks(req.user).then(hooks => {
      console.log(hooks);
      let template = ''  

      for(let i in hooks) {
        if(req.params.name in hooks[i]) {
           template += hooks[i][req.params.name]()
        }
      }
      
      return res.send(template)
    
    })
  })
}

module.exports = Hooks
