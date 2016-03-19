'use strict';
var user = {username: 'test', password: 'test', home: __dirname + '/../fixtures/tree', key: 1, admin: 1, readonly: 0}
var mm = require('micromatch')

describe('admin', function() {

  before(bootstrap.autoAgent)

  before(bootstrap.login)

  it('should be granted', function(cb) {
    this.request.get('/a')
    .end(cb)
  })

  it('should get create page', function(cb) {
    this.skip()
     this.request.get('/a/create').end(cb)
  })

  it('should get users', function(cb) {
    this.request.get('/a/users')
    .expect(function(res) {
      expect(res.body).to.be.an.array
    })
    .expect(200)
    .end(cb)
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
    bootstrap.logout(() => {
      bootstrap.login(user, cb)
    })
  })

  it('should be granted', function(cb) {
    this.request.get('/a')
    .end(cb)
  })

  it('should not get update page', function(cb) {
     this.request.get('/a/update/nonexistant').expect(404).end(cb)
  })

  it('should logout from test', function(cb) {
    this.request.get('/logout')  
    .end(cb)
  })

  it('should get update page', function(cb) {
    this.skip()
     this.request.get('/a/update/test').end(cb)
  })

  it('should login as admin', bootstrap.login)

  it('should update user (admin = 0, ignore=dir*)', function(cb) {
    user.admin = 0
    user.password = 'new'
    user.ignore = 'dir*'
    user.readonly = 1
    this.request.put('/a/users') 
    .send(user)
    .expect(200)
    .end(cb)
  })

  it('should update with POST _method=PUT', function(cb) {
    user.admin = 0
    user.password = 'new'
    user._method = 'PUT'
    this.request.post('/a/users') 
    .expect(200)
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
    delete user._method
    bootstrap.logout(() => {
      bootstrap.login(user, cb)
    })
  })

  it('should be forbidden', function(cb) {
    this.request.get('/a')
    .expect(403)
    .end(cb)
  })

  it('should get a tree without dir*', function(cb) {
    this.request.get('/tree')
    .expect(function(res) {
      var tree = res.body.tree
      for(let i in tree) {
        expect(mm.isMatch(tree[i].name, 'dir*')).to.be.false
      }
    })
    .end(cb)
  })

  it('should get profil', function(cb) {
    this.request.get('/me')
    .end(cb)
  })

  it('should not update settings (admin, trash)', function(cb) {
    //readonly is 1 so trash is not settable
    this.request.put('/settings')
    .send({admin : 1, home: __dirname, trash: 'trashpath'})
    .expect(function(res) {
      let body = res.body.user
      expect(res.body.info).not.to.be.undefined
      expect(body.admin).to.equal(0)
      expect(body.home).not.to.be.undefined
      expect(body.trash).to.equal('')
    })
    .end(cb)
  })

  it('should not update username', function(cb) {
    this.request.put('/settings')
    .send({username: 'someoneelse'})
    .expect(function(res) {
      expect(res.body.user.username).to.equal('test') 
    })
    .end(cb)
  })

  it('should update settings', function(cb) {
    this.request.put('/settings')
    .send({key: 1})
    .expect(function(res) {
      expect(res.body.user.key).not.to.equal(user.key)
    })
    .end(cb)
  })

  it('should login as admin', function(cb) {
    bootstrap.logout(() => {
      bootstrap.login(cb)
    })
  })

  it('should delete user', function(cb) {
    this.request.delete('/a/delete/test') 
    .end(cb)
  })

  it('should not delete itself', function(cb) {
    this.request.delete('/a/delete/admin') 
    .expect(400)
    .end(cb)
  })

  it('should login as test', function(cb) {
    this.request.post('/login')
    .send(user)
    .expect(401)
    .end(cb)
  })

  after(bootstrap.logout)
})
