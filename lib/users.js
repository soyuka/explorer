var debug = require('debug')('explorer:users')
var Promise = require('bluebird')
var util = require('util')
var fs = Promise.promisifyAll(require('fs'))
var p = require('path')
var eol = require('os').EOL
var bcrypt = Promise.promisifyAll(require('bcrypt'))

const  saltLength = 9
const  keyLength = 25

/**
 * Database handler
 */
class Users {

  constructor(options) {
    options = options || {} 

    this.database = options.database || p.resolve(__dirname, '../data/users')
  }

  /**
   * Load database from file
   * @return Promise
   */
  load() {
    let self = this

    return this.parse()  
    .then(function(users) {
      debug('DB Loaded, %o', users)
      self.users = users 
    })
    .catch(function(e) {
      console.error('Can not load database')
    })
  }

  /**
   * Remove a user from the file
   * @param string username
   * @return Promise
   */
  remove(username) {
    let u = this.users.findIndex(u => u.username == username)

    if(!~u) {
      return Promise.reject(`User ${username} not found`)
    }

    this.users.splice(u, 1)

    return this.write()
  }

  /**
   * Put a user to the file
   * @param string username
   * @callback
   */
  put(user) {
    if(!(user instanceof User))
      throw new TypeError('Not a User instance')

    let u = this.users.findIndex(e => e.username == user.username)

    if(~u) {
      debug('update user %s, %s', user.username, user)
      this.users[u] = user
    } else {
      debug('user created %s', user)
      this.users.push(user) 
    }

    return this.write()
  }

  write() {
    let str = []

    for(let i of this.users) {
      i && str.push(i.toString())
    }

    return fs.writeFileAsync(this.database, str.join(eol))
  }

  parse() {
   return fs.readFileAsync(this.database, {encoding: 'utf-8'}) 
   .then(function(db) {
     
     db = db.split(eol)

     if(db[db.length - 1] === '')
       db.pop()

     let promises = db.map(e => e.split(':'))
     .map(e => new User({
       username: e[0], 
       password: e[1],
       home: e[2],
       key: e[3],
       admin: e[4] === '1' ? true : false
     }, false))

     return Promise.all(promises)
   })
  }

  get(username) {
    return this.users.find(u => u.username == username)
  }

  delete(username) {
    let u = this.users.findIndex(e => e.username == username)

    if(!~u) {
      return Promise.reject(`User ${username} does not exist`) 
    }

    this.users.splice(u, 1)

    return this.write()
  }

  getByKey(key) {
    return this.users.find(u => u.key == key)
  }

  authenticate(username, password) {
    let u = this.get(username) 

    if(!u) return Promise.reject(`No user with the username ${username}`)

    return bcrypt.compareAsync(password, u.password)
    .then(ok => Promise.resolve(ok))
    .catch(function(err) {
      console.error(err) 
      return Promise.reject(`wrong password`)
    })
  }
}

class User {

  constructor(user, crypt = true) {
    this.properties = ['username', 'password', 'home', 'key', 'admin']

    user.admin = this.valueToIntegerBool(user.admin)

    debug('New User %o', user)

    if(!this.isValid(user)) {
      throw new TypeError("User is not valid") 
    }

    for(var i in user) {
      if(!this[i])
        this[i] = user[i]
    }

    if(!crypt)
      return Promise.resolve(this)

    return this.crypt()
  }

  isValid(user) {
    let valid = this.properties.filter(e => !user.hasOwnProperty(e) || /:/g.test(user[e]))

    return valid.length == 0
  }

  /**
   * valueToIntegerBool 
   * transforms :
   *   - '1', 1, true to 1 
   *   - '0', 0, false to 0 
   * @throws TypeError
   * @param mixed v
   * @return integer
   */
  valueToIntegerBool(v) {
    if(typeof v == 'boolean') {
      return v === true ? 1 : 0
    }

    if(v !== undefined) {
      //json outputs an integer, body outputs a string
      return v = parseInt(''+v) === 1 ? 1 : 0
    }

    return 0
  }

  crypt() {
    let self = this
    return bcrypt.hashAsync(this.password, saltLength)
   .then(function(hash) {
      self.password = hash; 
      return Promise.resolve(self)
   })
   .catch(function(err) {
      console.error(err) 
      return Promise.reject('Could not hash password')
   })
  }

  generateKey() {
    let self = this

    return bcrypt.genSaltAsync(saltLength)
    .then(function(salt) {
      return bcrypt.hashAsync(salt, saltLength)
    })
    .then(function(hash) {
      let l = hash.length 
      let s = []
      let i = 0
      while(l-- && i < keyLength ) {
        let c = hash.charAt(l)
        if(/[a-z0-9]/i.test(c)) {
          s.push(c) 
          i++
        }
      }

      self.key = s.join('')
      return Promise.resolve(self)
    })
    .catch(function(err) {
      console.error(err) 
      return Promise.reject('Could not generate key')
    })
  }

  toString() {
    let str = []

    for(let p of this.properties) {
      str.push(`${this[p]}`)
    }

    return str.join(':')
  }
}

export {User, Users}
