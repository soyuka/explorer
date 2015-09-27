"use strict";
var Promise = require('bluebird')
var User = require('../lib/data/user.js')
var middlewares = require('../middlewares')
var handleSystemError = require('../lib/utils.js').handleSystemError
var HTTPError = require('../lib/HTTPError.js')

function settings(req, res) {
  return res.renderBody('settings.haml', {user: req.user})
}

/**
 * @api {put} /settings Update user settings
 * @apiName userSettings
 * @apiGroup User
 * @apiUse UserSchema
 */
function updateSettings(req, res, next) {

  var u = req.users.get(req.user.username)

  if(!u) {
    return handleSystemError(next)('User not found', 404)
  }

  var ignore = ['home', 'admin', 'readonly', 'ignore']

  if(req.user.readonly) {
    ignore = ignore.concat(['trash', 'archive'])
  }
    
  u.update(req.body, ignore)
  .then(function(user) {
    return req.users.put(user)
    .then(function() {
      req.flash('info', 'Settings updated')
      return res.handle('/settings', req.users.get(u.username))
    })
  })
  .catch(handleSystemError(next))
}

var Settings = function(app) {
  var config = app.get('config')

  app.get('/settings', middlewares.trashSize(config), middlewares.prepareTree(app), settings)
  app.put('/settings', updateSettings)

  return app
}

module.exports = Settings
