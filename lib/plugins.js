'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _jobStatJs = require('./job/stat.js');

var _jobStatJs2 = _interopRequireDefault(_jobStatJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _middlewares = require('../middlewares');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var debug = require('debug')('explorer:plugins');

/**
 * registerPlugins
 * require plugin and call router if it exists
 * called in server.js
 * @see plugins documentation
 * @param Express app
 * @return void sets plugins app.set('plugins')
 */
function registerPlugins(app) {

  var config = app.get('config');
  var plugins = {};

  for (var name in config.plugins) {
    var e = config.plugins[name];

    var item = _path2['default'].join(config.plugin_path, name);

    try {
      if (e.module) {
        item = _path2['default'].dirname(require.resolve(e.module));
      }

      debug('Requiring plugin %s', name);
      plugins[name] = _util2['default']._extend(require(item), { path: item });
    } catch (e) {

      console.error('Could not require %s', item);
      if (config.dev) console.error(e.stack);
    }
  }

  app.set('plugins', plugins);
}

function registerPluginsRoutes(app) {

  var config = app.get('config');
  var plugins = app.get('plugins');
  var allowKeyAccess = config.allowKeyAccess;

  var _loop = function (_name) {

    var route = _path2['default'].join('/p/', _name);

    //move this to another file + require after req.format
    if ('router' in plugins[_name]) {

      var router = new _express.Router();

      router = plugins[_name].router(router, {
        prepareTree: (0, _middlewares.prepareTree)(app),
        HTTPError: _libHTTPErrorJs2['default'],
        interactor: _libJobInteractorJs2['default']
      }, config);

      debug('Using router for plugin %s on /p/%s', _name, _name);

      app.use(route, router);
    }

    var views_path = _path2['default'].join(plugins[_name].path, 'views');

    try {
      _fs2['default'].accessSync(views_path);

      //Adding views directory
      var views = app.get('views');
      views.push(views_path);
      app.set('views', views);
    } catch (e) {
      console.error('No views for plugin %s (%s)', _name, views_path);
    }

    if (!('allowKeyAccess' in plugins[_name])) {
      return 'continue';
    } else if (!_util2['default'].isArray(plugins[_name].allowKeyAccess)) {
      console.error('allowKeyAccess must be an array');
      return 'continue';
    }

    allowKeyAccess = allowKeyAccess.concat(plugins[_name].allowKeyAccess.map(function (e) {
      return _path2['default'].join(route, e);
    }));
  };

  for (var _name in plugins) {
    var _ret = _loop(_name);

    if (_ret === 'continue') continue;
  }

  config.allowKeyAccess = allowKeyAccess;

  app.set('config', config);
}

exports.registerPlugins = registerPlugins;
exports.registerPluginsRoutes = registerPluginsRoutes;