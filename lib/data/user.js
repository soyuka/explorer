'use strict';
var Promise = require('bluebird')
var schema = require('./userSchema.js')
var debug = require('debug')('explorer:data:user')
var bcrypt = Promise.promisifyAll(require('bcrypt'))
var fs = Promise.promisifyAll(require('fs'))
var mkdirp = require('mkdirp')
var existsSync = require('../utils.js').existsSync
var p = require('path')
var eol = require('os').EOL
const jwt = require('jsonwebtoken')

const  saltLength = 9
const  keyLength = 25

/**
 * User class
 */
function User(user, crypt) {
  crypt = crypt !== undefined ? crypt : true
  user = this.sanitize(user)

  debug('New User %o', user)

  if(!this.isValid(user)) {
    throw new TypeError("User is not valid") 
  }

  for(let i in user) {
    if(!this[i])
      this[i] = user[i]
  }

  if(!crypt)
    return Promise.resolve(this)

  return this.crypt()
}


/**
 * getCookie
 * @return object safe user object (remove password,salt)
 */
User.prototype.getCookie = function getCookie() {
  return {
    username: this.username, 
    admin: this.admin,
    home: p.normalize(this.home), 
    key: this.key
  } 
}

/**
 * sanitize a user object according to the schema
 * @param object user
 * @return object sanitized user
 */
User.prototype.sanitize = function sanitize(user) {
  for(let i in schema) {
    if(typeof user[i] === 'undefined' && schema[i].default !== undefined) {
      user[i] = schema[i].default 
    } else if(schema[i].type == 'boolean') {
      user[i] = this.valueToIntegerBool(user[i])
    } else if(schema[i].type == 'buffer' && user[i].length && typeof user[i] == 'string') {
      user[i] = user[i].split(eol).map(e => e.trim()).filter(v => v.length > 0)
    }
  }

  return user
}

/**
 * Valids a user through the schema
 * @param user
 * @return boolean
 */
User.prototype.isValid = function isValid(user) {
  var valid = Object.keys(schema).filter(e => !user.hasOwnProperty(e) || /:/g.test(user[e]))

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
User.prototype.valueToIntegerBool = function valueToIntegerBool(v) {
  if(typeof v == 'boolean') {
    return v === true ? 1 : 0
  }

  if(v !== undefined) {
    //json outputs an integer, body outputs a string
    return v = parseInt(''+v) === 1 ? 1 : 0
  }

  return 0
}

/**
 * Crypt 
 * Hash this.password
 * @return Promise
 */
User.prototype.crypt = function crypt() {
  var self = this
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

/**
 * Generates the alphanumerical user key
 * @return Promise
 */
User.prototype.generateKey = function generateKey() {
  var self = this

  //using bcrypt to generate a key
  return bcrypt.genSaltAsync(saltLength)
  .then(function(salt) {
    return bcrypt.hashAsync(salt, saltLength)
  })
  .then(function(hash) {
    var l = hash.length 
    var s = []
    var i = 0
    //take only alpha-numeric chars
    while(l-- && i < keyLength ) {
      var c = hash.charAt(l)
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

/**
 * Updates the current user with new values
 * @param object user the new user object
 * @param array ignore keys to be ignored
 * @return Promise
 */
User.prototype.update = function update(user, ignore) {

  ignore = ignore ? ignore : []

  for(let i in schema) {
    if(schema[i].update === false && !~ignore.indexOf(i))  {
      ignore.push(i)
    }
  }

  var crypt = true

  //we don't want to update password
  if(user.password == '' || typeof user.password == 'undefined') {
    crypt = false
  }

  user = this.sanitize(user)

  for(let i in user) {
    if(~ignore.indexOf(i) || !~Object.keys(schema).indexOf(i) || typeof user[i] === 'undefined')
      continue;

    if(i == 'password' && crypt === false)
      continue;

    if(schema[i].directory === true && user[i].length) {
      var dir = p.resolve(user.home, user[i])

      if(!existsSync(dir)) {
        try {
          mkdirp.sync(dir) 
        } catch(e) {
          console.error('Could not create directory ' + dir) 
          console.error(e.stack) 
        }
      }
    }

    this[i] = user[i]
  }

  //we want to update the key (form boolean checkbox/option)
  if(''+user.key === '1') {
    return this.generateKey()
    .then(u => crypt ? u.crypt() : Promise.resolve(u))
  }

  return crypt ? this.crypt() : Promise.resolve(this)
}

/**
 * Sign a jsonwebtoken
 * @param {String} secret
 * @todo support public key
 */
User.prototype.sign = function(secret) {
  return jwt.sign(this.getCookie(), secret)
}

/**
 * Returns the user string for database
 * @return string
 */
User.prototype.toString = function toString() {
  var str = []

  for(let p in schema) {
    if(schema[p].type == 'buffer') {
      var b = Array.isArray(this[p]) ? this[p].join(eol) : this[p]
      str.push(new Buffer(b).toString('base64'))
    } else {
      str.push(''+this[p])
    }
  }

  return str.join(':')
}

module.exports = User
