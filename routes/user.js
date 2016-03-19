'use strict'
const HTTPError = require('../lib/errors/HTTPError.js')
const handleSystemError = require('../lib/utils.js').handleSystemError
const middlewares = require('../middlewares')
const Promise = require('bluebird')

let User = function(app, router) {
  const config = app.get('config')
  const users = app.get('users')
  const revokeCache = app.get('cache')('revoke')
  const jwt = middlewares.jwt(app)

  /**
   * @api {get} /me Get user profile
   * @apiName userSettings
   * @apiGroup User
   * @apiUse UserSchema
   */
  function getMe(req, res) {
    req.user.trashSize = res.locals.trashSize
    return res.handle(req.user)
  }

  /**
   * @api {put} /settings Update user settings
   * @apiName userSettings
   * @apiGroup User
   * @apiUse UserSchema
   */
  function updateSettings(req, res, next) {

    var u = users.get(req.user.username)

    if(!u) {
      return handleSystemError(next)('User not found', 404)
    }

    var ignore = ['home', 'admin', 'readonly', 'ignore']

    if(req.user.readonly) {
      ignore = ignore.concat(['trash', 'archive'])
    }
      
    u.update(req.body, ignore)
    .then(function(user) {
      return users.put(user)
      .then(function() {
        return res.handle({
          info: 'Settings updated',
          user: users.get(user.username).getCookie()
        })
      })
    })
    .catch(handleSystemError(next))
  }
  /**
   * @api {get} /api/logout Logout
   * @apiGroup User
   * @apiName logout
   */
  function logout(req, res) {
    revokeCache.put(req.user.username, '1')
    return res.handle({})
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
      return next(new HTTPError('One of the required fields is missing', 400))
    }

    users.authenticate(req.body.username, req.body.password)
    .then(function(ok) {
    
      if(ok) {
        revokeCache.remove(req.body.username)
        let u = users.get(req.body.username)
        let token = u.sign(config.session_secret)

        u = u.getCookie()
        u.token = token

        return res.handle(u)
      } 

      return next(new HTTPError('Wrong password', 401))
    }) 
    .catch(function(e) {
      if(typeof e == 'string')
        return next(new HTTPError(e, 401))
      else
        return handleSystemError(next)(e)
    })
  }

  router.get('/logout', logout)

  router.get('/me', middlewares.trashSize(config), getMe)
  router.put('/settings', updateSettings)

  /**
   * @api {get} /logout Logout
   * @apiGroup User
   * @deprecated
   * @apiName logout
   */
  app.get('/logout', function(req, res, next) {
    jwt(req, res, function(err) {
      if(err)
        return next(err)

      req.url = '/api/logout'
      return app._router.handle(req, res, next) 
    })
  })

  app.post('/login', login)
}

module.exports = User
