import Promise from 'bluebird'
import {User} from '../lib/users.js'
import {trashSize, prepareTree} from './middlewares.js'

function handleSystemError(req, res) {
  return function (err) {
    console.error(err)
    req.flash('error', err)
    return res.redirect('back')
  }
}

function settings(req, res) {
  return res.renderBody('settings.haml', {user: req.user})
}

function updateSettings(req, res) {

  if(!req.body.username == req.user.username)
    return handleSystemError(req, res)("Can't update another user")

  let u = req.users.get(req.user.username)

  if(!u) {
    return handleSystemError(req,res)('User not found')
  }

  let ignore = ['home', 'admin', 'readonly', 'ignore']

  if(req.user.readonly) {
    ignore.concat(['trash', 'archive'])
  }
    
  u.update(req.body, ignore)
  .then(function(user) {
    return req.users.put(user)
    .then(function() {
      req.flash('info', `Settings updated`)
      return res.redirect('/settings')
    })
  })
  .catch(handleSystemError(req, res))
}

let Settings = function(app) {
  let config = app.get('config')

  app.get('/settings', trashSize(config), prepareTree(config), settings)
  app.put('/settings', updateSettings)

  return app
}

export {Settings}
