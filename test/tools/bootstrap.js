'use strict';
var p = require('path')
var fs = require('fs')
var util = require('util') 
var expect = require('chai').expect
var CallableTask = require('relieve').tasks.CallableTask
var Promise = require('bluebird')
var app = require('../../server.js')
var Notify = require('../../lib/job/notify.js')
var Worker = require('../../lib/job/worker.js')

var cwd = p.join(__dirname, '..')

var config_path = p.join(cwd, './fixtures/config.yml')

var config = require('../../lib/config.js')(config_path)
config.database = p.join(cwd, './fixtures/users')

if(!fs.existsSync(config.database)) {
  fs.writeFileSync(config.database, fs.readFileSync(p.join(cwd, '/../doc/examples/data/users')))
}

var cache = require('../../lib/cache')(config)

var options = {
  headers: []
}

//default test headers
options.headers['X-Requested-With'] = 'XMLHttpRequest'
options.headers['Accept'] = 'application/json'

module.exports = {
  config: config,
  options: options,
  login: function(cb) {
    this.request.post('/login')
    .send({username: 'admin', password: 'admin'})
    .expect(function(res) {
      options.headers['Authorization'] = res.body.token
      expect(res.body.username).to.equal('admin')
      expect(res.body.key).to.equal('key')
      expect(res.body.home).not.to.be.undefined
    })
    .end(cb)
  },
  logout: function(cb) {
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
    }

    if(bootstrap.app) {
      return cb(require('./supertest.js')(bootstrap.app, options)) 
    }

    bootstrap.worker = bootstrap.worker === undefined ? new Worker() : bootstrap.worker

    return app(config, bootstrap.worker).then(function(app) {
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
