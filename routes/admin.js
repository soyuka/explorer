'use strict'
const Promise = require('bluebird')
const p = require('path')
const yaml = require('yamljs')
const utils = require('../lib/utils.js')
const User = require('../lib/data/user.js')
const tree = require('../lib/tree.js').tree
const HTTPError = require('../lib/errors/HTTPError.js')
const middlewares = require('../middlewares')
const emptyTrash = require('./emptyTrash.js')

const fs = Promise.promisifyAll(require('fs'))
const debug = require('debug')('explorer:routes:admin')

/**
 * @apiDefine UserSchema
 * @apiParam (Admin) {string} username
 * @apiParam (User) {string} password
 * @apiParam (Admin) {string} home 
 * @apiParam (User) {string} key '1' to re-generate
 * @apiParam (Admin) {boolean} admin 
 * @apiParam (Admin) {boolean} readonly 
 * @apiParam (Admin) {array} ignore
 * @apiParam (User) {string} trash
 * @apiParam (User) {string} archive
 * @apiParam (User) {string} upload
 */
var Admin = function(app, router) {
  const admin = require('express').Router()
  const config = app.get('config')
  const pt = middlewares.prepareTree(app)
  const users = app.get('users')

  /** 
   * validUser middleware
   */
  function validUser(req, res, next) {
    try {
      new User(req.body, false) 
    } catch(e) {
      return next(e)
    }

    return next()
  }

  /**
   * checks if user is admin
   * @param object config
   * @return function
   */
  function isAdmin(req, res, next) {
    if(!req.user.admin)
      return next(new HTTPError('Forbidden', 403))

    res.locals.config = config
    res.locals.ymlConfig = yaml.stringify(config, 2, 4) 

    return next()
  }

  admin.use(isAdmin)

  /**
   * @api {post} /a/trash Empty global trash
   * @apiName emptyTrash
   * @apiGroup Admin
   */
  admin.post('/trash', pt, emptyTrash(app, config.remove.path))

  /**
   * @api {get} /a/delete/:username Delete user
   * @apiName deleteUser
   * @apiGroup Admin
   * @apiParam {String} username
   */
  admin.delete('/delete/:username', function(req, res, next) {
    if(req.user.username == req.params.username) {
      return next(new HTTPError("You can't delete yourself", 400))
    }

    users.delete(req.params.username)
    .then(function() {
      return res.handle({'info': 'User '+req.params.username+' deleted'}) 
    })
    .catch(utils.handleSystemError(next))
  })

  /**
   * @api {post} /a/users Create user
   * @apiName createUser
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.post('/users', validUser, function(req, res, next) {

    if(users.get(req.body.username)) {
      return next(new HTTPError('User already exists', 400))
    }

    let u = null

    return new User(req.body) 
    .then(function(user) {
      return user.generateKey()
    })
    .then(function(user) {
      u = user
      return users.put(user)
    })
    .then(function() {
      return res.handle({info: 'User '+u.username+' created', user: u}, 201)
    })
    .catch(utils.handleSystemError(next))
  })

  /**
   * @api {put} /a/users Update user
   * @apiName updateUser
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.put('/users', function(req, res, next) {
    const u = users.get(req.body.username)

    if(!(u instanceof User)) {
      return next(new HTTPError('User not found', 404))
    }
    
    u.update(req.body)
    .then(function(user) {
      return users.put(user)
    })
    .then(function() {
      return res.handle({'info': 'User '+u.username+' updated'})
    })
    .catch(utils.handleSystemError(next))
  })

  /**
   * @api {get} /a/users Get users
   * @apiName listUsers
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.get('/users', function(req, res, next) {
    return res.handle(users.data)
  })

  /**
   * @api {get} /a/users Update user
   * @apiName updateUser
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.get('/user/:username', function(req, res, next) {
    const u = users.get(req.params.username)

    return res.handle(u.getCookie())
  })

  /**
   * @api {get} /a/trashSize Get trash size
   * @apiName trashSize
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.get('/trashSize', middlewares.trashSize(config, true), function(req, res, next) {
    return res.handle({trashSize: res.locals.trashSize})
  })

  router.use('/a', admin)
}

module.exports = Admin
