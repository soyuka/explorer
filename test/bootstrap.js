import p from 'path'
import {expect} from 'chai'
import Promise from 'bluebird'
import {getConfiguration} from '../lib/config.js'
import app from '../server.js'

let config_path = p.join(__dirname, './fixtures/config.yml')

let config = getConfiguration(config_path)
config.database = p.join(__dirname, './fixtures/users')

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
  createAgent: function(cb) {
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



