'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

var _libUtilsJs = require('../lib/utils.js');

var _libUsersJs = require('../lib/users.js');

var _libTreeJs = require('../lib/tree.js');

var _middlewaresJs = require('./middlewares.js');

var fs = _bluebird2['default'].promisifyAll(require('fs'));
var debug = require('debug')('explorer:routes:admin');

//@todo move this
function handleSystemError(req, res) {
  return function (err) {
    console.error(err);
    req.flash('error', err);
    return res.redirect('back');
  };
}

function validUser(req, res, next) {
  if (!req.body.username) return handleSystemError(req, res)('User is not valid');

  try {
    new _libUsersJs.User(req.body, false);
  } catch (e) {
    console.error(e);
    return handleSystemError(req, res)('User is not valid');
  }

  return next();
}

function isAdmin(config) {
  return function (req, res, next) {
    if (!req.user.admin) return res.status(403).send('Forbidden');

    res.locals.config = config;
    res.locals.ymlConfig = _yamljs2['default'].stringify(config, 2, 4);

    return next();
  };
}

var Admin = function Admin(app) {
  var admin = require('express').Router();
  var config = app.get('config');

  admin.use(isAdmin(config));

  admin.get('/', (0, _middlewaresJs.trashSize)(config), function (req, res) {
    return res.renderBody('admin', { users: req.users.users, remove: config.remove && config.remove.method == 'mv' });
  });

  admin.post('/trash', function (req, res) {

    debug('Empty trash %s', config.remove.trash);

    (0, _libUtilsJs.removeDirectoryContent)(config.remove.trash).then(function () {
      return res.redirect('back');
    })['catch'](handleSystemError);
  });

  admin.get('/create', function (req, res) {
    return res.renderBody('admin/user/create.haml');
  });

  admin.get('/update/:username', function (req, res) {
    var u = req.users.get(req.params.username);

    if (!u) {
      return handleSystemError(req, res)('User not found');
    }

    return res.renderBody('admin/user/update.haml', { user: u });
  });

  admin.get('/delete/:username', function (req, res) {
    req.users['delete'](req.params.username).then(function () {
      req.flash('info', 'User ' + req.params.username + ' deleted');
      return res.redirect('/a');
    })['catch'](handleSystemError(req, res));
  });

  admin.post('/users', validUser, function (req, res) {

    if (req.users.get(req.body.username)) {
      return handleSystemError(req, res)('User already exists');
    }

    return new _libUsersJs.User(req.body).then(function (user) {
      return user.generateKey();
    }).then(function (user) {
      return req.users.put(user).then(function () {
        req.flash('info', 'User ' + user.username + ' created');
        return res.redirect('/a');
      });
    })['catch'](handleSystemError(req, res));
  });

  admin.put('/users', function (req, res) {
    var u = req.users.get(req.body.username);

    if (!(u instanceof _libUsersJs.User)) {
      return handleSystemError(req, res)('User not found');
    }

    u.update(req.body).then(function (user) {
      return req.users.put(user).then(function () {
        req.flash('info', 'User ' + user.username + ' updated');
        return res.redirect('/a');
      });
    })['catch'](handleSystemError(req, res));
  });

  app.use('/a', admin);
};

exports.Admin = Admin;