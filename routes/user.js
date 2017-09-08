'use strict';
var util = require('util')
var HTTPError = require('../lib/HTTPError.js')
var handleSystemError = require('../lib/utils.js').handleSystemError
var Promise = require('bluebird')

var debug = require('debug')('explorer:routes:user')

const cookieOptions = { httpOnly: false }

function home(req, res) {
  return res.renderBody('login.haml')
}

/**
 * @api {get} /logout Logout
 * @apiGroup User
 * @apiName logout
 */
function logout(req, res) {
  res.cookie('user', {}, util._extend({}, cookieOptions, {expires: new Date()}))
  return res.handle('/login')
}

/**
 * @api {post} /login Login
 * @apiGroup User
 * @apiName login
 * @apiParam {string} username
 * @apiParam {string} password
 */
function login(req, res, next) {

  if(!req.body.username || !req.body.password) {
    return next(new HTTPError('One of the required fields is missing', 400, '/login'))
  }

  req.users.authenticate(req.body.username, req.body.password)
  .then(function(ok) {

    debug('Auth %s', ok)
  
    if(ok) {
      var u = req.users.get(req.body.username)

      debug('%s logged in', u)

      res.cookie('user', u.getCookie(), cookieOptions)

      return res.handle('/', u.getCookie())
    } 

    return next(new HTTPError('Wrong password', 401, '/login'))
  }) 
  .catch(function(e) {
    if(typeof e == 'string')
      return next(new HTTPError(e, 401, '/login'))
    else
      return handleSystemError(next)(e)
  })
}

/**
 * @api {get} /notifications Get notifications
 * @apiGroup User
 * @apiName getNotifications
 */
function notifications(req, res, next) {
  return res.renderBody('notifications') 
}

/**
 * @api {delete} /notifications Delete notifications
 * @apiGroup User
 * @apiName deleteNotifications
 */
function getDeleteNotifications(app) {
  var plugins_cache = app.get('plugins_cache')

  return function deleteNotifications(req, res, next) {
    
    var notifications = {}

    for(let i in plugins_cache) {
      notifications[i] = plugins_cache[i].remove(req.user.username)
    }

    return Promise.props(notifications)
    .then(function(notifications) {
      req.flash('info', res.locals.notifications.num + ' notifications deleted')
      return res.handle('/notifications')
    })
  }
}

var User = function(app) {
  app.get('/logout', logout)
  app.get('/login', home)
  app.get('/notifications', notifications)
  app.delete('/notifications', getDeleteNotifications(app))
  app.post('/login', login)

  return app
}

module.exports = User
