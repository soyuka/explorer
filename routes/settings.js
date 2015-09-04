import Promise from 'bluebird'
import {User} from '../lib/users.js'
import {trashSize, prepareTree} from '../middlewares'
import {handleSystemError} from '../lib/utils.js'
import HTTPError from '../lib/HTTPError.js'

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

  let u = req.users.get(req.user.username)

  if(!u) {
    return handleSystemError(next)('User not found', 404)
  }

  let ignore = ['home', 'admin', 'readonly', 'ignore']

  if(req.user.readonly) {
    ignore = ignore.concat(['trash', 'archive'])
  }
    
  u.update(req.body, ignore)
  .then(function(user) {
    return req.users.put(user)
    .then(function() {
      req.flash('info', `Settings updated`)
      return res.handle('/settings', req.users.get(u.username))
    })
  })
  .catch(handleSystemError(next))
}

let Settings = function(app) {
  let config = app.get('config')

  app.get('/settings', trashSize(config), prepareTree(app), settings)
  app.put('/settings', updateSettings)

  return app
}

export {Settings}
