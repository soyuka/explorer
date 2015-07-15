'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libUsersJs = require('../lib/users.js');

var _middlewaresJs = require('./middlewares.js');

function handleSystemError(req, res) {
  return function (err) {
    console.error(err);
    req.flash('error', err);
    return res.redirect('back');
  };
}

function settings(req, res) {
  return res.renderBody('settings.haml', { user: req.user });
}

function updateSettings(req, res) {

  if (!req.body.username == req.user.username) return handleSystemError(req, res)('Can\'t update another user');

  var u = req.users.get(req.user.username);

  if (!u) {
    return handleSystemError(req, res)('User not found');
  }

  var ignore = ['home', 'admin', 'readonly', 'ignore'];

  if (req.user.readonly) {
    ignore.concat(['trash', 'archive']);
  }

  u.update(req.body, ignore).then(function (user) {
    return req.users.put(user).then(function () {
      req.flash('info', 'Settings updated');
      return res.redirect('/settings');
    });
  })['catch'](handleSystemError(req, res));
}

var Settings = function Settings(app) {
  var config = app.get('config');

  app.get('/settings', (0, _middlewaresJs.trashSize)(config), (0, _middlewaresJs.prepareTree)(config), settings);
  app.put('/settings', updateSettings);

  return app;
};

exports.Settings = Settings;