'use strict';
var express = require('express')
var p = require('path')
var util = require('util')
var hamljs = require('hamljs')
var bodyParser = require('body-parser')
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

    // .unless(function(req) {
    //
    //   let unless = ['/', '/login', '/a'].filter(e => e === req.path)
    //
    //   if(unless.length)
    //     return true
    //
    //   unless = ['/font', '/templates', '/dist', '/node_modules']
    //            .filter(e => ~req.path.indexOf(e))
    //
    //   if(unless.length)
    //     return true
    //
    //   return ~['.ico', '.png'].indexOf(p.extname(req._parsedUrl.pathname))
    // }),
module.exports = function(config, worker) {

  if(!config.quiet)
    app.use(morgan(config.dev ? 'dev' : 'tiny'))

  app.use(bodyParser.urlencoded({
    extended: false, 
    limit: config.upload.maxSize,
    parameterLimit: 1e5
  }))
  app.use(bodyParser.json({limit: config.upload.maxSize}))

  const users = new Users({database: p.resolve(__dirname, config.database)})

  app.set('config', config)
  app.set('worker', worker)
  app.set('users', users)

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

  app.use(function(req, res, next) {
    if(req.query.key && isKeyAllowed(req.path)) {
      let user = users.getByKey(req.query.key)

      if(user) {
        req.headers.authorization = user.sign(config.session_secret)
      }
    }

    next()
  })

  app.use([
    methodOverride(function(req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
          var method = req.body._method
          delete req.body._method
          return method
        }
    }),
    middlewares.format(app)
  ])

  app.use(function(req, res, next) {
    res.locals.app_root = config.app_root ? config.app_root : '/'
    return next()
  })

  const router = express.Router()
  const jwt = middlewares.jwt(app)

  //register plugins hooks
  // app.use(middlewares.registerHooks(app))
  //register plugins routes
  plugins.registerPluginsRoutes(app)

  routes.Tree(app, router)
  // routes.Settings(app)
  // routes.Admin(app)
  routes.Notifications(app, router)
  routes.Hooks(app, router)
  app.use('/api', jwt, router)

  //Load routes
  routes.User(app)

  app.use(middlewares.error(config))

  app.use('/', express.static('client'))

  app.get('/*', function(req, res, next) {
    return res.render('index.haml')
  })

  app.use(function(req, res, next) {
    return res.status(404).render('404.haml')
  })

  //load users from file to memory
  return users.load()
  .then(function() {
    if(!config.quiet)
      console.log('Db loaded')

    return Promise.resolve(app)
  })
  .catch(function(err) {
    console.error('Error while reading database') 
    console.error(err.stack)
  })
}
