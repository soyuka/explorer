import express from 'express'
import p from 'path'
import util from 'util'
import hamljs from 'hamljs'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import session from 'express-session'
import flash from 'connect-flash'
import methodOverride from 'method-override'
import morgan from 'morgan'
import Promise from 'bluebird'

import {Users} from './lib/users.js'
import * as routes from './routes'
import HTTPError from './lib/HTTPError.js'
import * as middlewares from './middlewares'
import {parallelMiddlewares} from './lib/utils.js'

let fs = Promise.promisifyAll(require('fs'))
let debug = require('debug')('explorer:server')
let app = express()

module.exports = function(config) {

  if(!config.quiet)
    app.use(morgan(config.dev ? 'dev' : 'tiny'))

  app.use(bodyParser.urlencoded({extended: false, limit: config.upload.maxSize}))
  app.use(bodyParser.json({limit: config.upload.maxSize}))

  app.set('config', config)
  app.set('view engine','haml' )

  app.engine('.haml', function(str, options, fn) {
    options.locals = util._extend({}, options)
    //debug('template locals', options.locals)
    return hamljs.renderFile(str, 'utf-8', options, fn)
  })

  app.use(parallelMiddlewares([
    methodOverride(function(req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
          let method = req.body._method
          delete req.body._method
          return method
        }
    }),
    cookieParser(),
    //sessions are only used for flash
    session({secret: config.session_secret, resave: false, saveUninitialized: false}),
    flash(),
    express.static('client')
  ]))

  app.use(function(req, res, next) {
    req.config = config
    req.users = users

    res.locals.app_root = config.app_root ? config.app_root : '/'

    res.locals.messages = {
      info: req.flash('info'),
      error: req.flash('error')
    }

    res.locals.upload = config.upload

    return next()
  })

  app.use(middlewares.user)

  app.use(parallelMiddlewares([
    middlewares.format(app),
    middlewares.notify,
    middlewares.optionsCookie,
  ]))

  //Load routes
  routes.Tree(app)
  routes.Upload(app)
  routes.User(app)
  routes.Settings(app)
  routes.Admin(app)

  app.use(middlewares.error(config))

  //where is this ES6 feature?
  let users = new Users({database: p.resolve(__dirname, config.database)})

  //load users from file to memory
  return users.load()
  .then(e => !config.quiet ? console.log('Db loaded') : 1)
  .then(e => Promise.resolve(app))
  .catch(function(err) {
    console.error('Error while reading database') 
    console.error(err.stack)
  })
}
