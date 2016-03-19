'use strict';
var Users = require('../../lib/data/users.js')
var User  = require('../../lib/data/user.js')
var ReasonsError  = require('../../lib/errors/ReasonsError.js')

describe('users', function() {

  var users = null
  var user = {username: 'admin', password: 'admin', home: __dirname + '/../fixtures/tree', key: 'key', admin: true, readonly: false}
  var u

  before(function(cb) {
    users = new Users({database: __dirname + '/../fixtures/users'}) 

    users.load().then(cb)
  })
  
  it('should not be valid', function() {
    try{
      new User({username: 'test'})
    } catch(e) {
      console.log(e)
      expect(e instanceof ReasonsError).to.be.true
      expect(e.message).to.be.an.array
    }
  })

  it('cannot be empty', function() {
    try{
      new User({username: ''})
    } catch(e) {
      expect(e instanceof ReasonsError).to.be.true
      expect(e.message).to.be.an.array
      expect(e.message[0]).to.equal('username is required')
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
    var u = users.get('admin')
    expect(u).not.to.be.undefined
    expect(u).to.have.any.keys(Object.keys(user)) 
  })

  it('should exist by key', function() {
    var u = users.getByKey('key')
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

  //Validates that data has been written to disk
  it('should authenticate with a new instance', function(cb) {
    var users_b = new Users({database: __dirname + '/../fixtures/users'}) 

    users_b.load().then(function() {
      users.authenticate('admin', 'admin')
      .then(function(v) {
        expect(v).to.equal(true)
        cb()
      })
    })
  })

  it('should be a valid user string', function() {
    var str = u.toString().split(':')
    
    Object.keys(user).forEach(function(e, i) {
      if(e == 'admin' | e == 'readonly') {
        expect(str[i]).to.equal(''+user[e])
      } else if(e != 'password') {
        expect(str[i]).to.equal(user[e])
      }
    })
  })

  it('should update user', function(cb) {
    user.home = '/home/test'
    new User(user, false).then(function(u) {
      return users.put(u)
    }) 
    .then(cb)
  })
  
  it('should be up to date', function() {
    var u = users.get('admin')

    expect(u.home).to.equal('/home/test')
  })

  it('should add an user', function(cb) {
    user.username = 'test'
    new User(user).then(function(u) {
      return users.put(u)
    }) 
    .then(function() {
      expect(users.data).to.have.length.of(2)
      cb()
    })
  })

  it('should remove an user', function(cb) {
    users.remove('test').then(function() {
      expect(users.data).to.have.length.of(1)
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

  it('should update a multiline buffer', function(cb) {
    var u = users.get('admin')
    u.update({ignore: '/home/test/p0rn\n/home/test/incomplete\n'})
    .then(function(u) {
      expect(u.ignore).to.deep.equal(['/home/test/p0rn', '/home/test/incomplete'])
      return users.put(u)
    })
    .then(cb)
    .catch(cb)
  })

  it('should get the multiline buffer back after loading database', function(cb) {
    var t = new Users({database: __dirname + '/../fixtures/users'})

    t.load()
    .then(function() {
      expect(t.get('admin').ignore).to.deep.equal(['/home/test/p0rn', '/home/test/incomplete'])
      cb()
    })
    .catch(cb)
  })

  it('should not update admin key', function(cb) {
  
    var u = users.get('admin')

    u.update({key: 'nothing'})
    .then(function(u) {
      expect(u).not.to.equal('nothing')
      cb()
    })
  })

  it('should not update admin home because of ignored key', function(cb) {
  
    var u = users.get('admin')

    u.update({home: 'some'}, ['home'])
    .then(function(u) {
      expect(u).not.to.equal('some')
      cb()
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
