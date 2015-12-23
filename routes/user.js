'use strict'
const HTTPError = require('../lib/HTTPError.js')
const handleSystemError = require('../lib/utils.js').handleSystemError

let User = function(app) {
  const config = app.get('config')
  const users = app.get('users')
  const revokeCache = app.get('cache')('revoke')

  /**
   * @api {get} /logout Logout
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

  app.get('/logout', logout)
  app.post('/login', login)
}

module.exports = User
