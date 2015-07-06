import Promise from 'bluebird'
import p from 'path'
import yaml from 'yamljs'
import {noDotFiles, extend, removeDirectoryContent} from '../lib/utils.js'
import {User} from '../lib/users.js'
import {tree} from '../lib/tree.js'
import {trashSize} from './middlewares.js'

let fs = Promise.promisifyAll(require('fs'))
let debug = require('debug')('explorer:routes:admin')

//@todo move this
function handleSystemError(req, res) {
  return function (err) {
    console.error(err)
    req.flash('error', err)
    return res.redirect('back')
  }
}

function validUser(req, res, next) {
  if(!req.body.username)
    return handleSystemError(req, res)('User is not valid')

  try {
    new User(req.body, false) 
  } catch(e) {
    console.error(e)  
    return handleSystemError(req, res)('User is not valid')
  }

  return next()
}

function isAdmin(config) {
  return function(req, res, next) {
    if(!req.user.admin)
      return res.status(403).send('Forbidden')

    res.locals.config = config
    res.locals.ymlConfig = yaml.stringify(config, 2, 4) 

    return next()
  }
}

let Admin = function(app) {
  let admin = require('express').Router()
  let config = app.get('config')

  admin.use(isAdmin(config))

  admin.get('/', trashSize(config), function(req, res) {
    return res.renderBody('admin', {users: req.users.users, remove: config.remove && config.remove.method == 'mv'})
  })

  admin.post('/trash', function(req, res) {

    debug('Empty trash %s', config.remove.trash)

    removeDirectoryContent(config.remove.trash)
    .then(function() {
      return res.redirect('back')
    })
    .catch(handleSystemError)
  })

  admin.get('/create', function(req, res) {
    return res.renderBody('admin/user/create.haml')
  })

  admin.get('/update/:username', function(req, res) {
    let u = req.users.get(req.params.username)

    if(!u) {
      return handleSystemError(req,res)('User not found')
    }

    return res.renderBody('admin/user/update.haml', {user: u})
  })

  admin.get('/delete/:username', function(req, res) {
    req.users.delete(req.params.username)
    .then(function() {
      req.flash('info', `User ${req.params.username} deleted`)
      return res.redirect('/a') 
    })
    .catch(handleSystemError(req, res))
  })

  admin.post('/users', validUser, function(req, res) {

    if(req.users.get(req.body.username)) {
      return handleSystemError(req, res)('User already exists')
    }

    return new User(req.body) 
    .then(function(user) {
      return user.generateKey()
    })
    .then(function(user) {
      return req.users.put(user)
      .then(function() {
        req.flash('info', `User ${user.username} created`)
        return res.redirect('/a')
      })
    })
    .catch(handleSystemError(req, res))
  })

  admin.put('/users', function(req, res) {
    let u = req.users.get(req.body.username)

    if(!(u instanceof User)) {
      return handleSystemError(req,res)('User not found')
    }
    
    u.update(req.body)
    .then(function(user) {
      return req.users.put(user)
      .then(function() {
        req.flash('info', `User ${user.username} updated`)
        return res.redirect('/a')
      })
    })
    .catch(handleSystemError(req, res))
  })

  app.use('/a', admin)

}

export {Admin}
