'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _hamljs = require('hamljs');

var _hamljs2 = _interopRequireDefault(_hamljs);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libUsersJs = require('./lib/users.js');

var _routes = require('./routes');

var routes = _interopRequireWildcard(_routes);

var _libHTTPErrorJs = require('./lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _middlewares = require('./middlewares');

var middlewares = _interopRequireWildcard(_middlewares);

var _libUtilsJs = require('./lib/utils.js');

var fs = _bluebird2['default'].promisifyAll(require('fs'));
var debug = require('debug')('explorer:server');
var app = (0, _express2['default'])();

module.exports = function (config) {

  if (!config.quiet) app.use((0, _morgan2['default'])(config.dev ? 'dev' : 'tiny'));

  app.use(_bodyParser2['default'].urlencoded({ extended: false }));
  app.use(_bodyParser2['default'].json());

  app.set('config', config);
  app.set('view engine', 'haml');

  app.engine('.haml', function (str, options, fn) {
    options.locals = _util2['default']._extend({}, options);
    //debug('template locals', options.locals)
    return _hamljs2['default'].renderFile(str, 'utf-8', options, fn);
  });

  app.use((0, _libUtilsJs.parallelMiddlewares)([(0, _methodOverride2['default'])(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }), (0, _cookieParser2['default'])(),
  //sessions are only used for flash
  (0, _expressSession2['default'])({ secret: config.session_secret, resave: false, saveUninitialized: false }), (0, _connectFlash2['default'])(), _express2['default']['static']('client')]));

  app.use(function (req, res, next) {
    req.config = config;
    req.users = users;

    res.locals.app_root = config.app_root ? config.app_root : '/';

    res.locals.messages = {
      info: req.flash('info'),
      error: req.flash('error')
    };

    return next();
  });

  app.use(middlewares.user);

  app.use((0, _libUtilsJs.parallelMiddlewares)([middlewares.format(app), middlewares.notify, middlewares.optionsCookie]));

  //Load routes
  routes.Tree(app);
  routes.Upload(app);
  routes.User(app);
  routes.Settings(app);
  routes.Admin(app);

  app.use(middlewares.error(config));

  //where is this ES6 feature?
  var users = new _libUsersJs.Users({ database: _path2['default'].resolve(__dirname, config.database) });

  //load users from file to memory
  return users.load().then(function (e) {
    return !config.quiet ? console.log('Db loaded') : 1;
  }).then(function (e) {
    return _bluebird2['default'].resolve(app);
  })['catch'](function (err) {
    console.error('Error while reading database');
    console.error(err.stack);
  });
};