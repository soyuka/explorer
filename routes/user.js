'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _libUtilsJs = require('../lib/utils.js');

var debug = require('debug')('explorer:routes:user');

var cookieOptions = { httpOnly: false };

function home(req, res) {
  return res.renderBody('login.haml');
}

/**
 * @api {get} /logout Logout
 * @apiGroup User
 * @apiName logout
 */
function logout(req, res) {
  res.cookie('user', {}, _util2['default']._extend({}, cookieOptions, { expires: new Date() }));
  return res.handle('/login');
}

/**
 * @api {post} /login Login
 * @apiGroup User
 * @apiName login
 * @apiParam {string} username
 * @apiParam {string} password
 */
function login(req, res, next) {

  if (!req.body.username || !req.body.password) {
    return next(new _libHTTPErrorJs2['default']('One of the required fields is missing', 400, '/login'));
  }

  req.users.authenticate(req.body.username, req.body.password).then(function (ok) {

    debug('Auth %s', ok);

    if (ok) {
      var u = req.users.get(req.body.username);

      debug('%s logged in', u);

      res.cookie('user', u.getCookie(), cookieOptions);

      return res.handle('/', u.getCookie());
    }

    return next(new _libHTTPErrorJs2['default']('Wrong password', 401, '/login'));
  })['catch'](function (e) {
    if (typeof e == 'string') return next(new _libHTTPErrorJs2['default'](e, 401, '/login'));else return (0, _libUtilsJs.handleSystemError)(next)(e);
  });
}

/**
 * @api {get} /notifications Get notifications
 * @apiGroup User
 * @apiName getNotifications
 */
function notifications(req, res, next) {
  return res.renderBody('notifications');
}

/**
 * @api {delete} /notifications Delete notifications
 * @apiGroup User
 * @apiName deleteNotifications
 */
function deleteNotifications(req, res, next) {

  if (!_libJobInteractorJs2['default'].ipc) {
    debug('No interactor');
    return next(new _libHTTPErrorJs2['default']('No Interactor', 400));
  }

  _libJobInteractorJs2['default'].ipc.once('clear:get', function (data) {

    debug('Remove notifications %o', data);

    req.flash('info', res.locals.notifications.num + ' notifications deleted');

    return res.handle('/notifications');
  });

  _libJobInteractorJs2['default'].ipc.send('get', 'clear', req.user.username);
}

var User = function User(app) {
  app.get('/logout', logout);
  app.get('/login', home);
  app.get('/notifications', notifications);
  app['delete']('/notifications', deleteNotifications);
  app.post('/login', login);

  return app;
};

exports.User = User;