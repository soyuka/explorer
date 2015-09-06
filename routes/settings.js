'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libUsersJs = require('../lib/users.js');

var _middlewares = require('../middlewares');

var _libUtilsJs = require('../lib/utils.js');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

function settings(req, res) {
  return res.renderBody('settings.haml', { user: req.user });
}

/**
 * @api {put} /settings Update user settings
 * @apiName userSettings
 * @apiGroup User
 * @apiUse UserSchema
 */
function updateSettings(req, res, next) {

  var u = req.users.get(req.user.username);

  if (!u) {
    return (0, _libUtilsJs.handleSystemError)(next)('User not found', 404);
  }

  var ignore = ['home', 'admin', 'readonly', 'ignore'];

  if (req.user.readonly) {
    ignore = ignore.concat(['trash', 'archive']);
  }

  u.update(req.body, ignore).then(function (user) {
    return req.users.put(user).then(function () {
      req.flash('info', 'Settings updated');
      return res.handle('/settings', req.users.get(u.username));
    });
  })['catch']((0, _libUtilsJs.handleSystemError)(next));
}

var Settings = function Settings(app) {
  var config = app.get('config');

  app.get('/settings', (0, _middlewares.trashSize)(config), (0, _middlewares.prepareTree)(app), settings);
  app.put('/settings', updateSettings);

  return app;
};

exports.Settings = Settings;