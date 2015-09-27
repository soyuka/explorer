"use strict";
var p = require('path')
var fs = require('fs')
var util = require('util') 
var expect = require('chai').expect
var Promise = require('bluebird')
var getConfiguration = require('../lib/config.js')
var app = require('../server.js')

var config_path = p.join(__dirname, './fixtures/config.yml')

var config = getConfiguration(config_path)
config.database = p.join(__dirname, './fixtures/users')

if(!fs.existsSync(config.database)) {
  fs.writeFileSync(config.database, fs.readFileSync(p.join(__dirname, '/../doc/examples/data/users')))
}

var options = {
  headers: []
}

//headers used for testing
options.headers['X-Requested-With'] = 'XMLHttpRequest'
options.headers['Accept'] = 'application/json'

module.exports = {
  config: config,
  options: options,
  login: function(cb) {
    this.request.post('/login')
    .expect(200)
    .send({username: 'admin', password: 'admin'})
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  },
  logout: function(cb) {
    this.request.get('/logout')
    .expect(200)
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
   .end(cb)
  },
  createAgent: function(opts, cb) {
    var conf = config

    if(typeof opts == 'function') {
      cb = opts
    } else {
      conf = util._extend(conf, opts) 
    }

    return app(config).then(function(app) {
      return cb(require('./supertest')(app, options))
    })
  },
  autoAgent: function(cb) {
    var self = this

    bootstrap.createAgent(function(r) {
      self.request = r
      return cb()
    })
  },
  removeAgent: function(cb) {
    this.request = null
    return cb()
  }
}
