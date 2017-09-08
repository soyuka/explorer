'use strict';
var express = require('express')
var p = require('path')
var util = require('util')
var hamljs = require('hamljs')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var flash = require('connect-flash')
var methodOverride = require('method-override')
var morgan = require('morgan')
var Promise = require('bluebird')
var HTTPError = require('./lib/HTTPError.js')
var plugins = require('./lib/plugins.js')

var Users = require('./lib/data/users.js')
var routes = require('./routes')
var middlewares = require('./middlewares')

var fs = Promise.promisifyAll(require('fs'))
var debug = require('debug')('explorer:server')
var app = express()

module.exports = function(config, worker) {

  if(!config.quiet)
    app.use(morgan(config.dev ? 'dev' : 'tiny'))

  app.use(bodyParser.urlencoded({
    extended: false, 
    limit: config.upload.maxSize,
    parameterLimit: 1e5
  }))
  app.use(bodyParser.json({limit: config.upload.maxSize}))

  app.set('config', config)
  app.set('worker', worker)

  let cache = require('./lib/cache')(config)

  app.set('cache', function getCache(namespace) {
    if(config.cache == 'redis')
      return new cache(namespace, require('./lib/redis.js')(config))
    else
      return new cache(namespace)
  })

  app.set('view engine', 'haml')
  app.set('view cache', true)
  app.set('views', [p.join(__dirname, 'views')])

  //this registers plugins (app.set('plugins') and app.set('plugins_cache'))
  plugins.registerPlugins(app)

  app.engine('.haml', function(str, options, fn) {
    options.locals = util._extend({}, options)
    //debug('template locals', options.locals)
    return hamljs.renderFile(str, 'utf-8', options, fn)
  })

  app.use([
    methodOverride(function(req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
          var method = req.body._method
          delete req.body._method
          return method
        }
    }),
    cookieParser(),
    //sessions are only used for flash
    session({secret: config.session_secret || 'MEOW', resave: false, saveUninitialized: false}),
    flash(),
    express.static('client')
  ])

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

  app.use(middlewares.user(app))

  app.use([
    middlewares.format(app),
    middlewares.notify(app),
    middlewares.optionsCookie
  ])

  app.use(middlewares.registerHooks(app))

  //register plugins routes
  plugins.registerPluginsRoutes(app)

  //Load routes
  routes.Tree(app)
  routes.User(app)
  routes.Settings(app)
  routes.Admin(app)

  app.use(middlewares.error(config))

  app.use(function(req, res, next) {
    return res.status(404).render('404.haml')
  })

  let users = new Users({database: p.resolve(__dirname, config.database)})

  //load users from file to memory
  return users.load()
  .then(function() {
    if(!config.quiet)
      console.log('Db loaded')

    app.set('users', users) 

    return Promise.resolve(app)
  })
  .catch(function(err) {
    console.error('Error while reading database') 
    console.error(err.stack)
  })
}
