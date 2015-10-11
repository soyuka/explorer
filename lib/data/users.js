'use strict';
var Promise = require('bluebird')
var util = require('util')
var Database = require('./database.js')
var User = require('./user.js')
var schema = require('./userSchema.js')
var bcrypt = Promise.promisifyAll(require('bcrypt'))
var p = require('path')
var debug = require('debug')('explorer:data:users')

function Users(options) {
  options = options || {} 

  options.dataProperty = 'users'
  options.database = options.database || p.resolve(__dirname, '../../data/users')

  Database.call(this, schema, User, options)
}

util.inherits(Users, Database)


/**
 * Gets a User by key
 * @return User
 */
Users.prototype.getByKey = function getByKey(key) {
  return this.data.find(u => u.key == key)
}

/**
 * Authenticates a user
 * @param string username
 * @param string password
 * @return Promise
 */
Users.prototype.authenticate = function authenticate(username, password) {
  var u = this.get(username) 

  if(!u) {
    debug('User not found')
    return Promise.reject('No user with the username '+username)
  }

  return bcrypt.compareAsync(password, u.password)
  .then(ok => Promise.resolve(ok))
  .catch(function(err) {
    console.error(err.stack) 
    return Promise.reject('Wrong password')
  })
}

module.exports = Users
