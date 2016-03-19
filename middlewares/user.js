'use strict';
var HTTPError = require('../lib/errors/HTTPError.js')
var p = require('path')
var util = require('util')

var debug = require('debug')('explorer:middlewares:user')

function isValidForKey(path) {
  return path == '/' || path == '/download' || path == '/search'
}

function getUser(app) {
  var config = app.get('config')

  /**
   * Middleware that handles the user cookie
   * on error end @see HTTPError
   * on success populates req.user 
   */
  return function userMiddleware(req, res, next) {

    var locals =  {}
    var user = req.cookies.user

    var isKeyAllowed = config.allowKeyAccess.some(e => e == req.path)

    if((!user || !user.username) && req.query.key && isKeyAllowed) {
      user = req.user = req.users.getByKey(req.query.key) 
      
      if(!req.user) {
        return res.status(401).send('Key is not valid')
      }
    }

    if(req.url != '/login' && (!user || !user.username)) {
      return next(new HTTPError("Not authenticated", 401, '/login'))
    } 
    
    if(user && user.username && !req.user) {
      req.user = req.users.get(user.username)

      //has a bad cookie
      if(!req.user) {
        res.cookie('user', {}, util._extend({}, {httpOnly: false}, {expires: -1}))
        return next(new HTTPError("Bad cookie", 400, '/login'))
      }

    }

    debug('User %o', user)

    return next()
  } 

}

module.exports = getUser
