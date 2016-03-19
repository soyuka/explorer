'use strict'
const p = require('path')
const fs = require('fs')
const util = require('util') 
const expect = require('chai').expect
const CallableTask = require('relieve').tasks.CallableTask
const Promise = require('bluebird')
const app = require('../../server.js')
const Notify = require('../../lib/job/notify.js')
const Worker = require('../../lib/job/worker.js')

const cwd = p.join(__dirname, '..')

const config_path = p.join(cwd, './fixtures/config.yml')

const config = require('../../lib/config.js')(config_path)
config.database = p.join(cwd, './fixtures/users')

if(!fs.existsSync(config.database)) {
  fs.writeFileSync(config.database, fs.readFileSync(p.join(cwd, '/../doc/examples/data/users')))
}

const cache = require('../../lib/cache')(config)

const options = {
  headers: []
}

//default test headers
options.headers['X-Requested-With'] = 'XMLHttpRequest'
options.headers['Accept'] = 'application/json'
options.prefix = function(url) {
  if(url === '/login')
    return ''

  return '/api'
}

module.exports = {
  config: config,
  options: options,
  login: function(user, cb) {
    var self = this

    if(typeof user == 'function') {
      cb = user
      user = {username: 'admin', password: 'admin'} 
    }
    
    this.request.post('/login')
    .send(user)
    .expect(function(res) {
      options.headers['Authorization'] = 'Bearer ' + res.body.token
      expect(res.body.username).to.equal(user.username)
      expect(res.body.home).not.to.be.undefined
      delete res.body.token
      delete res.body.iat
      self.user = res.body
    })
    .end(cb)
  },
  logout: function(cb) {
    delete this.user
    this.request.get('/logout')
    .expect(200)
    .end(e => {
      this.request.get('/tree') 
      .expect(401)
      .end(cb)
   })
  },
  createAgent: function(opts, cb) {

    var conf = config

    if(typeof opts == 'function') {
      cb = opts
    } else {
      conf = util._extend(conf, opts) 

      if(opts.disable_plugins) {
        ;['move', 'archive', 'upload'].forEach(function(e, i) { delete conf.plugins[e] })
      }
    }

    if(bootstrap.app) {
      return cb(require('./supertest.js')(bootstrap.app, options)) 
    }

    bootstrap.worker = bootstrap.worker === undefined ? new Worker() : bootstrap.worker

    return app(conf, bootstrap.worker).then(function(app) {
      bootstrap.app = app

      return app.get('worker').run()
      .then(e => app.get('worker').register([], app.get('plugins_cache')))
      .then(function() {
        return cb(require('./supertest')(app, options))
      })
    })
  },
  autoAgent: function(cb) {
    var self = this
    if(bootstrap.request) {
      this.request = bootstrap.request
      return cb()
    }

    bootstrap.createAgent(function(r) {
      bootstrap.request = self.request = r
      return cb()
    })
  }
}
