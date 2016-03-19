'use strict'
const p = require('path')
const Promise = require('bluebird')
const Notify = require('../lib/job/notify.js')
const stream = require('stream')
const MultiStream = require('multistream')
const HTTPError = require('../lib/errors/HTTPError.js')

const debug = require('debug')('explorer:middlewares:registerHooks')

function Hooks(app, router) {

  const plugins = app.get('plugins')
  const config = app.get('config')
  const cache = app.get('cache')
  const hooks = app.get('hooks')

  router.get('/hooks/:name/template', function(req, res, next) {
    const streams = []

    let hook = hooks[req.params.name]

    if(!hook)
      return next(new HTTPError('Invalid hook name'))

    for(let plugin in hook) {
      let t = hook[plugin]

      if(typeof t !== 'object') {
        console.error('Hook %s (%s) is not an object, skipping!', plugin, req.params.name) 
        continue
      }

      if(!('template' in t)) {
        continue
      }

      let template = t.template

      if(typeof template === 'function')
        template = template()
        
      if(template instanceof stream.Readable) {
        streams.push(template) 
      } else if(typeof template == 'string' && template.length > 0) {
        let s = new stream.Readable 
        s._read = function noop() {}
        s.push(template)
        s.push(null)
        streams.push(s)
      } else {
        console.error('TypeError on the %s template (it should be a string or a stream.Readable, here %s, skipping!', plugin + req.params.name, typeof template) 
        continue
      }
    }

    res.set('Content-Type', 'text/html')

    MultiStream(streams).pipe(res)
  })

  router.get('/hooks/:name/scope', function(req, res, next) {
    let hook = hooks[req.params.name]

    if(!hook)
      return next(new HTTPError('Invalid hook name'))

    let promises = {}

    for(let plugin in hook) {
      let t = hook[plugin]

      if(typeof t !== 'object') {
        console.error('Hook %s (%s) is not an object, skipping!', pluin, req.params.name) 
        continue
      }

      if(!('scope' in t)) {
        continue
      }

      if(!(typeof t.scope == 'function')) {
        console.error('Hook scope %s (%s) is not a function, skipping!', pluin, req.params.name) 
        continue
      }

      promises[plugin] = t.scope(req, res)
    }

    Promise.props(promises)
    .then(scope => res.json(scope))
  })
}

module.exports = Hooks
