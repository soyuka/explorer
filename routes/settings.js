'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _libUsersJs = require('../lib/users.js');

var Promise = require('bluebird');

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

  var user = req.body;

  for (var i in u) {
    //                waiting for privates
    if (user[i] && typeof u[i] !== 'function') {
      u[i] = user[i];
    }
  }

  user = new _libUsersJs.User(u, !!req.body.password).then(function (user) {
    if ('' + user.key === '1') return user.generateKey();

    return Promise.resolve(user);
  }).then(function (user) {
    return req.users.put(user).then(function () {
      req.flash('info', 'Settings updated');
      return res.redirect('/settings');
    });
  })['catch'](handleSystemError(req, res));
}

var Settings = function Settings(app) {
  app.get('/settings', settings);
  app.put('/settings', updateSettings);

  return app;
};

exports.Settings = Settings;