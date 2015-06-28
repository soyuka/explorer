import { Users, User } from '../../lib/users.js'

describe('users', function() {

  var users = null
  var user = {username: 'admin', password: 'admin', home: __dirname + '/../fixtures/tree', key: 'key', admin: true}
  var u

  before(function(cb) {
    users = new Users({database: __dirname + '/../fixtures/users'}) 

    users.load().then(cb)
  })
  
  it('should not be valid', function() {

    try{
      new User({username: 'test'})
    } catch(e) {
      expect(e instanceof TypeError).to.be.true
    }

  })

  it('should be valid', function(cb) {
    new User(user)
    .then(function(o) {
      u = o
      return users.put(u)
    })
    .then(cb)
  })

  it('should not exist', function() {
    expect(users.get('root')).to.be.undefined
  })
  
  it('should exist', function() {
    let u = users.get('admin')
    expect(u).not.to.be.undefined
    expect(u).to.have.any.keys(Object.keys(user)) 
  })

  it('should exist by key', function() {
    let u = users.getByKey('key')
    expect(u).not.to.be.undefined
    expect(u).to.have.any.keys(Object.keys(user)) 
  })

  it('should not authenticate', function(cb) {
    users.authenticate('admin', 'wrongpass')
    .then(function(v) {
      expect(v).to.equal(false)
      cb()
    })
  })

  it('should authenticate', function(cb) {
    users.authenticate('admin', 'admin')
    .then(function(v) {
      expect(v).to.equal(true)
      cb()
    })
  })

  it('should be a valid user string', function() {
    var str = u.toString().split(':')
    
    Object.keys(user).forEach(function(e, i) {
      if(e == 'admin') {
        expect(!!str[i]).to.equal(!!user[e])
      } else if(e != 'password') {
        expect(str[i]).to.equal(user[e])
      }
    })
  })

  it('should update user', function(cb) {
    user.home = '/home/test'
    new User(user).then(function(u) {
      return users.put(u)
    }) 
    .then(cb)
  })
  
  it('should be up to date', function() {
    let u = users.get('admin')

    expect(u.home).to.equal('/home/test')
  })

  it('should add an user', function(cb) {
    user.username = 'test'
    new User(user).then(function(u) {
      return users.put(u)
    }) 
    .then(function() {
      expect(users.users).to.have.length.of(2)
      cb()
    })

  })

  it('should remove an user', function(cb) {
    users.remove('test').then(function() {
      expect(users.users).to.have.length.of(1)
      cb()
    })
  })

  it('should generate a salt', function(cb) {
    new User(user).then(function(u) {
      u.generateKey().then(function(user) {
        expect(user.key).to.have.length.of(25)
        expect(/[a-z0-9]/i.test(user.key)).to.be.true
        cb()
      })
    })
  })

  after(function(cb) {
    user.username = 'admin'
    user.password = 'admin'
    user.admin = true
    user.home = __dirname + '/../fixtures/tree'
    new User(user)
    .then(function(u) {
      return users.put(u)
    })
    .then(cb)
  })

})
