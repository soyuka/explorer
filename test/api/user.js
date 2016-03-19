'use strict';
var url = function(u) {
  return function(res) {
    expect(res.header.location).to.equal(u)
  }
}

var key

describe('user', function() {
  
  before(bootstrap.autoAgent)

  it('should not be logged in (401)', function(cb) {
    this.request.get('/tree')
    .expect(401)
    .end(cb)
  })

  it('should fail login (missing field)', function(cb) {
    this.request.post('/login')
    .send({})
    .expect(400)
    .end(cb)
  })

  it('should fail login (user does not exist)', function(cb) {
    this.request.post('/login')
    .send({username: 'nonexistant', password: 'no'})
    .expect(401)
    .end(cb)
  })

  it('should fail login (bad password)', function(cb) {
    this.request.post('/login')
    .send({username: 'admin', password: 'root'})
    .expect(401)
    .end(cb)
  })

  it('should login (json)', function(cb) {
    this.request.post('/login')  
    .send({username: 'admin', password: 'admin'})
    .expect(function(res) {
      expect(res.body.username).to.equal('admin')
      expect(res.body.key).to.equal('key')
      expect(res.body.home).not.to.be.undefined
      key = res.body.key
    })
    .end(cb)
  })

  it('should be logged in', function(cb) {
    this.request.get('/tree')
    .expect(200)
    .end(cb)
  })

  it('should get notifications', function(cb) {
    this.request.get('/notifications')
    .expect(200)
    .end(cb)
  })

  it('should get settings (DEPRECATED)', function(cb) {
    this.skip()
    this.request.get('/settings') 
    .expect(200)
    .end(cb)
  })

  it('should get profile', function(cb) {
   this.request.get('/me') 
   .expect(function(res) {
      expect(res.body.username).to.equal('admin')
      expect(res.body.key).to.equal('key')

      let notUndefined = [
        'admin',
        'home',
        'readonly',
        'ignore',
        'trash',
        'archive',
        'upload',
        'trashSize'
      ]

      for(let i in notUndefined) {
        expect(res.body[notUndefined[i]]).not.to.be.undefined
      }

      expect(res.body.password).to.be.undefined
   })
   .end(cb)
  })

  it('should get 404', function(cb) {
    this.request.get('/skjdgnsjdkh') 
    .expect(404)
    .end(cb)
  })

  it('should logout', bootstrap.logout)

  it('should be logged out', function(cb) {
    this.request.get('/someotherpath')
    .expect(401)
    .end(cb)
  })

  it('should access with key', function(cb) {
    this.request.get('/tree?key='+key) 
    .expect(200)
    .end(cb)
  })

  it('should access with key', function(cb) {
    this.request.get('/search?search=dir&key='+key) 
    .expect(200)
    .end(cb)
  })

  it('should not access with key', function(cb) {
    this.request.get('/settings?key='+key) 
    .expect(401)
    .end(cb)
  })
})
