'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var debug = require('debug')('explorer:middlewares:user');

function isValidForKey(path) {
  return path == '/' || path == '/download' || path == '/search';
}
/**
 * Middleware that handles the user cookie
 * on error end @see HTTPError
 * on success populates req.user 
 */
function user(req, res, next) {

  var locals = {};
  var user = req.cookies.user;

  if ((!user || !user.username) && req.query.key && isValidForKey(req.path)) {
    user = req.user = req.users.getByKey(req.query.key);

    if (!req.user) {
      return res.status(401).send('Key is not valid');
    }
  }

  if (req.url != '/login' && (!user || !user.username)) {
    return next(new _libHTTPErrorJs2['default']("Not authenticated", 401, '/login'));
  }

  if (user && user.username && !req.user) {
    req.user = req.users.get(user.username);

    //has a bad cookie
    if (!req.user) {
      res.cookie('user', {}, _util2['default']._extend({}, { httpOnly: false }, { expires: -1 }));
      return next(new _libHTTPErrorJs2['default']("Bad cookie", 400, '/login'));
    }

    //populating locals
    for (var i in req.user) {
      if (i != 'password') locals[i] = req.user[i];
    }
  }

  debug('User %o', user);

  res.locals.user = locals;

  return next();
}

exports.user = user;