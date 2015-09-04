import p from 'path'
import fs from 'fs'
import util from 'util' 
import {expect} from 'chai'
import Promise from 'bluebird'
import {getConfiguration} from '../lib/config.js'
import app from '../server.js'

let config_path = p.join(__dirname, './fixtures/config.yml')

let config = getConfiguration(config_path)
config.database = p.join(__dirname, './fixtures/users')

if(!fs.existsSync(config.database)) {
  fs.writeFileSync(config.database, fs.readFileSync(p.join(__dirname, '/../users.default')))
}

let options = {
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
    .set('Accept', 'text/html')
    .expect(302)
    .send({username: 'admin', password: 'admin'})
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  },
  logout: function(cb) {
    this.request.get('/logout')
    .set('Accept', 'text/html')
    .expect(302)
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



