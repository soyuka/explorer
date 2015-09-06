'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var debug = require('debug')('explorer:middlewares:notify');

/**
 * Notify middlewares
 * Calls every ipc plugin for the `info` method
 * Sets res.locals.notifications to an array of plugins and the user notifications
 */
function notify(req, res, next) {

  if (!_libJobInteractorJs2['default'].ipc) {
    debug('No interactor');
    res.locals.notifications = { num: 0 };
    return next();
  }

  _libJobInteractorJs2['default'].ipc.once('info:get', function (data) {

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

          for (var i in user_data[plugin]) {
            user_data[plugin][i].fromNow = (0, _moment2['default'])(user_data[plugin][i].time).fromNow();
          }
        } else {
          user_data[plugin] = {};
        }
      }
    }

    debug('User notifications %o', user_data);

    res.locals.notifications = _util2['default']._extend({ num: num }, user_data);

    return next();
  });

  _libJobInteractorJs2['default'].ipc.send('get', 'info');
}

exports['default'] = notify;
module.exports = exports['default'];