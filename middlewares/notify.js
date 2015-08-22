'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var debug = require('debug')('explorer:middlewares:notify');

function notify(req, res, next) {

  if (!_libJobInteractorJs2['default'].ipc) {
    debug('No interactor');
    res.locals.notifications = { num: 0 };
    return next();
  }

  _libJobInteractorJs2['default'].ipc.once('info', function (data) {

    debug('Notifications %o', data);

    var num = 0;
    var user_data = {};

    if (!req.user) {
      res.locals.notifications = { num: num };
      return next();
    }

    var notifications = {};
    var username = req.user.username;

    for (var plugin in data) {
      if (typeof data[plugin] == 'object') {
        if (username in data[plugin]) {
          num += Object.keys(data[plugin][username]).length;
          user_data[plugin] = data[plugin][username];
        } else {
          user_data[plugin] = {};
        }
      }
    }

    debug('User notifications %o', user_data);

    res.locals.notifications = _util2['default']._extend({ num: num }, user_data);

    return next();
  });

  _libJobInteractorJs2['default'].ipc.send('info');
}

exports['default'] = notify;
module.exports = exports['default'];