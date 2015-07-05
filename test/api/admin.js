var user = {username: 'test', password: 'test', home: __dirname + '/../fixtures/tree', key: 1, admin: 1, readonly: 0}
var app = require('../../server.js')

var agent

describe('admin', function() {

  before(login)

  before(function(cb) {
   app(config).then(function(app) {
      agent = require('supertest').agent(app)
      cb()
    }) 
  })

  it('should be granted', function(cb) {
    request.get('/a')
    .end(cb)
  })

  it('should get create page', function(cb) {
     request.get('/a/create').end(cb)
  })

  it('should add user', function(cb) {
    request.post('/a/users')
    .send(user)
    .expect(302)
    .end(cb)
  })

  it('should login as test', function(cb) {
    agent.post('/login') 
    .send({username: 'test', password: 'test'})
    .expect(302)
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  })

  it('should be granted', function(cb) {
    agent.get('/a')
    .end(cb)
  })

  it('should logout from test', function(cb) {
    agent.get('/logout')  
    .expect(302)
    .end(cb)
  })

  it('should get update page', function(cb) {
     request.get('/a/update/test').end(cb)
  })

  it('should update user (admin = 0)', function(cb) {
    user.admin = 0
    request.put('/a/users') 
    .expect(302)
    .send(user)
    .end(cb)
  })

  it('should login as test', function(cb) {
    agent.post('/login') 
    .send({username: 'test', password: 'test'})
    .expect(302)
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  })

  it('should be forbidden', function(cb) {
    agent.get('/a')
    .expect(403)
    .end(cb)
  })

  it('should delete user', function(cb) {
    request.get('/a/delete/test') 
    .expect(302)
    .end(cb)
  })

  after(logout)
})
