'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _libUtilsJs = require('../lib/utils.js');

var _libUsersJs = require('../lib/users.js');

var _libTreeJs = require('../lib/tree.js');

var debug = require('debug')('explorer:routes:admin');
var Promise = require('bluebird');
var rimraf = Promise.promisify(require('rimraf'));
var prettyBytes = require('pretty-bytes');
var fs = Promise.promisifyAll(require('fs'));
var p = require('path');

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
    new _libUsersJs.User(req.body);
  } catch (e) {
    console.error(e);
    return handleSystemError(req, res)('User is not valid');
  }

  return next();
}

function isAdmin(req, res, next) {
  if (!req.user.admin) return res.status(403).send('Forbidden');

  return next();
}

var Admin = function Admin(app) {
  var admin = require('express').Router();
  var config = app.get('config');
  admin.use(isAdmin);

  admin.get('/', function (req, res) {

    if (config.remove.method !== 'mv') return res.renderBody('admin', { users: req.users.users, remove: false, trash_size: '0 B' });

    (0, _libTreeJs.tree)(config.remove.trash, { maxDepth: 1 }).then(function (tree) {

      if (tree.tree.length == 0) return res.renderBody('admin', { users: req.users.users, remove: true, trash_size: '0 B' });

      var size = 0;

      for (var i in tree.tree) {
        size += tree.tree[i].size;
      }

      debug('Trash size %s', size);

      return res.renderBody('admin', { users: req.users.users, remove: true, trash_size: prettyBytes(size) });
    });
  });

  admin.post('/trash', function (req, res) {

    debug('Empty trash %s', config.remove.trash);

    fs.readdirAsync(config.remove.trash).filter(_libUtilsJs.noDotFiles).map(function (filename) {
      return rimraf(p.resolve(config.remove.trash, filename));
    }).then(function () {
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

    if (!u) {
      return handleSystemError(req, res)('User not found');
    }

    var user = req.body;

    for (var i in u) {
      // waiting for private class variable o/
      if (typeof u[i] !== 'function') {
        u[i] = user[i];
      }
    }

    user = new _libUsersJs.User(u, !!req.body.password).then(function (user) {
      if ('' + user.key === '1') return user.generateKey();

      return Promise.resolve(user);
    }).then(function (user) {
      return req.users.put(user).then(function () {
        req.flash('info', 'User ' + user.username + ' updated');
        return res.redirect('/a');
      });
    })['catch'](handleSystemError(req, res));
  });

  app.use('/a', admin);
};

exports.Admin = Admin;