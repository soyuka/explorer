var url = function(u) {
  return function(res) {
    expect(res.header.location).to.equal(u)
  }
}

describe('user', function() {
  
  it('should not be logged in', function(cb) {
    request.get('/')
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })

  it('should get login', function(cb) {
    request.get('/login')
    .expect(200)
    .end(cb)
  })

  it('should fail login', function(cb) {
    request.post('/login')
    .send({})
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })

  it('should fail login (user does not exist)', function(cb) {
    request.post('/login')
    .send({username: 'nonexistant'})
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })

  it('should fail login (bad password)', function(cb) {
    request.post('/login')
    .send({username: 'admin', password: 'root'})
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })

  it('should login', login)

  it('should be logged in', function(cb) {
    request.get('/')
    .end(cb)
  })

  it('should get settings', function(cb) {
    request.get('/settings') 
    .end(cb)
  })

  it('should update key', function(cb) {
    request.put('/settings')
    .send({key: 1})
    .expect(302)
    .end(cb)
  })

  it('should logout', logout)

  it('should be logged out', function(cb) {
    request.get('/')
    .expect(302)
    .expect(url('/login'))
    .end(cb)
  })
})
