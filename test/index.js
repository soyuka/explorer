var p = require('path')
var app = require('../server.js')

global.config = require('yamljs').load(p.join(__dirname, './fixtures/config.yml'))
global.config.database = p.join(__dirname, './fixtures/users')

global.expect = require('chai').expect

global.login = function(cb) {
  request.post('/login')
  .expect(302)
  .send({username: 'admin', password: 'admin'})
  .expect(function(res) {
    expect(res.headers['set-cookie']).not.to.be.undefined
  })
  .end(cb)
}

global.logout = function(cb) {
 request.get('/logout')
 .expect(302)
  .expect(function(res) {
    expect(res.headers['set-cookie']).not.to.be.undefined
  })
 .end(cb)
}

describe('lib', function() {
  require('./lib/utils.js')
  require('./lib/users.js')
  require('./lib/tree.js')
  require('./lib/search.js')
  require('./lib/nativeSearch.js')
})

describe('api', function() {
  before(function(cb) {
    app(config).then(function(app) {
      global.request = require('supertest').agent(app)
      cb()
    })
  })

  require('./api/user.js')
  require('./api/admin.js')
  require('./api/tree.js')
})
