'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var debug = require('debug')('explorer:middlewares:plugins');

function plugins(req, res, next) {

  var defaultAction = function defaultAction() {
    return '';
  };

  var defaults = {
    treeAction: defaultAction,
    treeItem: defaultAction
  };

  _libJobInteractorJs2['default'].ipc.once('config:get', function (data) {

    var resp = {};

    for (var plugin in data) {
      resp[plugin] = _util2['default']._extend(defaults, data[plugin]);

      for (var i in resp[plugin]) {
        var e = resp[plugin][i];
        if ('type' in e && e.type == 'function') {
          resp[plugin][i] = Function('locals', 'return ' + e.string)(res.locals);
        }
      }
    }

    debug('Plugins: ', resp);

    res.locals.plugins = resp;

    return next();
  });

  //qqch comem ca passer config
  _libJobInteractorJs2['default'].ipc.send('get', 'config', req.options, res.locals);
}

exports['default'] = plugins;
module.exports = exports['default'];