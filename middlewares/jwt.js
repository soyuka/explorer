'use strict';
const jwt = require('express-jwt')

module.exports = function(app) {
  const config = app.get('config')
  const revokeCache = app.get('cache')('revoke')

  let isKeyAllowed = function(path) {
    return config.allowKeyAccess.some(e => e == path)
  }

  return jwt({
    secret: config.session_secret,
    getToken: function(req) {
       if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1]
      } else if (req.body && req.body.token) {
        return req.body.token
      }

      return null
    },
    isRevoked: function isRevokedCallback(req, payload, done) {
      if(req.query.key && isKeyAllowed(req.path))
        return done(null, false)

      revokeCache.get(payload.username)
      .then(v => {
        done(null, v === '1')
      })
      .catch(done)
    }
  })
}
