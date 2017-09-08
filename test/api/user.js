'use strict';
var url = function(u) {
  return function(res) {
    expect(res.header.location).to.equal(u)
  }
}

var key

describe('user', function() {
  
  before(bootstrap.autoAgent)

  it('should not be logged in (302)', function(cb) {
    this.request.get('/')
    .expect(302)
    .end(cb)
  })

  it('should not be logged in (401)', function(cb) {
    this.request.get('/someotherpath')
    .expect(401)
    .end(cb)
  })

  it('should not be logged in (html)', function(cb) {
    this.request.get('/')
    .set('Accept', 'text/html')
    .expect(302)
    .end(cb)
  })

  it('should get login', function(cb) {
    this.request.get('/login')
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
      expect(res.headers['set-cookie']).not.to.be.undefined
      key = res.body.key
    })
    .end(cb)
  })

  it('should be logged in', function(cb) {
    this.request.get('/')
    .end(cb)
  })

  it('should get notifications', function(cb) {
    this.request.get('/notifications')
    .end(cb)
  })

  it('should get settings', function(cb) {
    this.request.get('/settings') 
    .end(cb)
  })

  it('should logout (json)', function(cb) {
    this.request.get('/logout')  
    .send({username: 'admin', password: 'admin'})
    .expect(function(res) {
      expect(res.headers['set-cookie']).not.to.be.undefined
    })
    .end(cb)
  })

  it('should be logged out', function(cb) {
    this.request.get('/')
    .expect(302)
    .end(cb)
  })

  it('should be logged out', function(cb) {
    this.request.get('/someotherpath')
    .expect(401)
    .expect(function(res) {
      expect(res.body.redirect).to.equal('/login')
    })
    .end(cb)
  })

  it('should be redirected to login', function(cb) {
    this.request.get('/') 
    .set('Accept', 'text/html')
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })

  it('should access with key', function(cb) {
    this.request.get('/?key='+key) 
    .end(cb)
  })

  it('should access with key', function(cb) {
    this.request.get('/search?search=dir&key='+key) 
    .end(cb)
  })

  it('should not access with key', function(cb) {
    this.request.get('/settings?key='+key) 
    .expect(401)
    .end(cb)
  })
})
