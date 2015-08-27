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

var _middlewares = require('../middlewares');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var fs = _bluebird2['default'].promisifyAll(require('fs'));
var debug = require('debug')('explorer:routes:admin');

function validUser(req, res, next) {
  try {
    new _libUsersJs.User(req.body, false);
  } catch (e) {
    return next(new _libHTTPErrorJs2['default']('User is not valid', 400));
  }

  return next();
}

function isAdmin(config) {
  return function (req, res, next) {
    if (!req.user.admin) return next(new _libHTTPErrorJs2['default']('Forbidden', 403));

    res.locals.config = config;
    res.locals.ymlConfig = _yamljs2['default'].stringify(config, 2, 4);

    return next();
  };
}

/**
 * @apiDefine UserSchema
 * @apiParam (Admin) {string} username
 * @apiParam (User) {string} password
 * @apiParam (Admin) {string} home 
 * @apiParam (User) {string} key '1' to re-generate
 * @apiParam (Admin) {boolean} admin 
 * @apiParam (Admin) {boolean} readonly 
 * @apiParam (Admin) {array} ignore
 * @apiParam (User) {string} trash
 * @apiParam (User) {string} archive
 * @apiParam (User) {string} upload
 */
var Admin = function Admin(app) {
  var admin = require('express').Router();
  var config = app.get('config');

  admin.use(isAdmin(config));

  admin.get('/', (0, _middlewares.trashSize)(config), (0, _middlewares.prepareTree)(config), function (req, res) {
    return res.renderBody('admin', {
      users: req.users.users
    });
  });

  admin.get('/create', function (req, res) {
    return res.renderBody('admin/user/create.haml');
  });

  admin.get('/update/:username', function (req, res, next) {
    var u = req.users.get(req.params.username);

    if (!u) {
      return next(new _libHTTPErrorJs2['default']('User not found', 404));
    }

    return res.renderBody('admin/user/update.haml', { user: u });
  });

  /**
   * @api {post} /a/trash Empty global trash
   * @apiName emptyTrash
   * @apiGroup Admin
   */
  admin.post('/trash', function (req, res, next) {

    debug('Empty trash %s', config.remove.path);

    (0, _libUtilsJs.removeDirectoryContent)(config.remove.path).then(function () {
      return res.handle('back');
    })['catch']((0, _libUtilsJs.handleSystemError)(next));
  });

  /**
   * @api {get} /a/delete/:username Delete user
   * @apiName deleteUser
   * @apiGroup Admin
   * @apiParam {String} username
   */
  admin.get('/delete/:username', function (req, res, next) {
    if (req.user.username == req.params.username) {
      return next(new _libHTTPErrorJs2['default']("You can't delete yourself", 400));
    }

    req.users['delete'](req.params.username).then(function () {
      req.flash('info', 'User ' + req.params.username + ' deleted');
      return res.handle('/a');
    })['catch']((0, _libUtilsJs.handleSystemError)(next));
  });

  /**
   * @api {post} /a/users Create user
   * @apiName createUser
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.post('/users', validUser, function (req, res, next) {

    if (req.users.get(req.body.username)) {
      return next(new _libHTTPErrorJs2['default']('User already exists', 400));
    }

    return new _libUsersJs.User(req.body).then(function (user) {
      return user.generateKey();
    }).then(function (user) {
      return req.users.put(user).then(function () {
        req.flash('info', 'User ' + user.username + ' created');
        return res.handle('/a', { user: user }, 201);
      });
    })['catch']((0, _libUtilsJs.handleSystemError)(next));
  });

  /**
   * @api {put} /a/users Update user
   * @apiName updateUser
   * @apiGroup Admin
   * @apiUse UserSchema
   */
  admin.put('/users', function (req, res, next) {
    var u = req.users.get(req.body.username);

    if (!(u instanceof _libUsersJs.User)) {
      return next(new _libHTTPErrorJs2['default']('User not found', 404));
    }

    u.update(req.body).then(function (user) {
      return req.users.put(user).then(function () {
        req.flash('info', 'User ' + user.username + ' updated');
        return res.handle('/a');
      });
    })['catch']((0, _libUtilsJs.handleSystemError)(next));
  });

  app.use('/a', admin);
};

exports.Admin = Admin;