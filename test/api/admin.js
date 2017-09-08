'use strict';
var user = {username: 'test', password: 'test', home: __dirname + '/../fixtures/tree', key: 1, admin: 1, readonly: 0}
var mm = require('micromatch')

describe('admin', function() {

  before(bootstrap.autoAgent)

  before(function(cb) {
    var self = this 

    bootstrap.createAgent(function(a) {
      self.agent = a 
      return bootstrap.login.call(self, cb)
    })
  })

  it('should be granted', function(cb) {
    this.request.get('/a')
    .end(cb)
  })

  it('should get create page', function(cb) {
     this.request.get('/a/create').end(cb)
  })

  it('should add user', function(cb) {
    this.request.post('/a/users')
    .send(user)
    .expect(201)
    .end(cb)
  })

  it('should not add user again', function(cb) {
    this.request.post('/a/users')
    .send(user)
    .expect(400)
    .end(cb)
  })

  it('should not add not valid user', function(cb) {
    this.request.post('/a/users')
    .send({username: 'test'})
    .expect(400)
    .end(cb)
  })

  it('should login as test', function(cb) {
    this.agent.post('/login') 
    .send({username: 'test', password: 'test'})
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  })

  it('should be granted', function(cb) {
    this.agent.get('/a')
    .end(cb)
  })

  it('should logout from test', function(cb) {
    this.agent.get('/logout')  
    .end(cb)
  })

  it('should get update page', function(cb) {
     this.request.get('/a/update/test').end(cb)
  })

  it('should not get update page', function(cb) {
     this.request.get('/a/update/nonexistant').expect(404).end(cb)
  })

  it('should update user (admin = 0, ignore=dir*)', function(cb) {
    user.admin = 0
    user.password = 'new'
    user.ignore = 'dir*'
    user.readonly = 1
    this.request.put('/a/users') 
    .send(user)
    .end(cb)
  })

  it('should update with POST _method=PUT', function(cb) {
    user.admin = 0
    user.password = 'new'
    user._method = 'PUT'
    this.request.post('/a/users') 
    .send(user)
    .end(cb)
  })

  it('should not update user', function(cb) {
    this.request.put('/a/users') 
    .send({username: 'nonexistant'})
    .expect(404)
    .end(cb)
  })

  it('should login as test', function(cb) {
    this.agent.post('/login') 
    .send({username: 'test', password: 'new'})
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
      user.key = res.body.key;
    })
    .end(cb)
  })

  it('should be forbidden', function(cb) {
    this.agent.get('/a')
    .expect(403)
    .end(cb)
  })

  it('should get a tree without dir*', function(cb) {
    this.agent.get('/')
    .expect(function(res) {
      var tree = res.body.tree
      for(let i in tree) {
        expect(mm.isMatch(tree[i].name, 'dir*')).to.be.false
      }
    })
    .end(cb)
  })

  it('should get settings', function(cb) {
    this.agent.get('/settings')
    .end(cb)
  })

  it('should not update settings (admin, trash)', function(cb) {
    //readonly is 1 so trash is not settable
    this.agent.put('/settings')
    .send({admin : 1, home: __dirname, trash: 'trashpath'})
    .expect(function(res) {
      expect(res.body.admin).to.equal(0)
      expect(res.body.home).to.equal(user.home)
      expect(res.body.trash).to.equal('')
    })
    .end(cb)
  })

  it('should not update username', function(cb) {
    this.agent.put('/settings')
    .send({username: 'someoneelse'})
    .expect(function(res) {
      expect(res.body.username).to.equal('test') 
    })
    .end(cb)
  })

  it('should update settings', function(cb) {
    this.agent.put('/settings')
    .send({key: 1})
    .expect(function(res) {
      expect(res.body.key).not.to.equal(user.key)
    })
    .end(cb)
  })

  it('should delete user', function(cb) {
    this.request.get('/a/delete/test') 
    .end(cb)
  })

  it('should not delete itself', function(cb) {
    this.request.get('/a/delete/admin') 
    .expect(400)
    .end(cb)
  })

  it('should not be available to login', function(cb) {
    this.agent.get('/')
    .expect(400)
    .end(cb)
  })

  after(bootstrap.logout)
})
