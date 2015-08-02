var user = {username: 'test', password: 'test', home: __dirname + '/../fixtures/tree', key: 1, admin: 1, readonly: 0}

describe('admin', function() {

  before(bootstrap.autoAgent)

  before(function(cb) {
    let self = this 

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

  it('should update user (admin = 0)', function(cb) {
    user.admin = 0
    user.password = 'new'
    this.request.put('/a/users') 
    .send(user)
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

  it('should get settings', function(cb) {
    this.agent.get('/settings')
    .end(cb)
  })

  it('should not update settings', function(cb) {
    this.agent.put('/settings')
    .send({admin : 1, home: __dirname})
    .expect(function(res) {
      expect(res.body.admin).to.equal(0)
      expect(res.body.home).to.equal(user.home)
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

  after(bootstrap.logout)
  after(bootstrap.removeAgent)
})
