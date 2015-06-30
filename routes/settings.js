var Promise = require('bluebird')

import {User} from '../lib/users.js'

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
  
  let user = req.body
  let nocrypt
    
  if(user.password == '' || typeof user.password == 'undefined') {
    user.password = u.password
    nocrypt = false
  
  }

  for(var i in u) {
    if(i == 'home' || i == 'admin')
      continue;

    //                          waiting for privates
    if(user[i] !== undefined && typeof u[i] !== 'function') {
      u[i] = user[i]
    }
  }
  
  user = new User(u, nocrypt)
  .then(function(user) {
    if(''+user.key === '1') 
      return user.generateKey()

    return Promise.resolve(user)
  })
  .then(function(user) {
    return req.users.put(user)
    .then(function() {
      req.flash('info', `Settings updated`)
      return res.redirect('/settings')
    })
  })
  .catch(handleSystemError(req, res))
}

var Settings = function(app) {
  app.get('/settings', settings)
  app.put('/settings', updateSettings)

  return app
}

export {Settings}
