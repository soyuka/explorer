'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jobStatJs = require('./job/stat.js');

var _jobStatJs2 = _interopRequireDefault(_jobStatJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var debug = require('debug')('explorer:plugins');

/**
 * registerPlugins
 * require plugin and call router if it exists
 * called in server.js
 * @see plugins documentation
 * @param Express app
 * @return void sets plugins app.set('plugins')
 */
function registerPlugins(config) {

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

      if (plugins[name]) delete plugins[name];
    }
  }

  return plugins;
}

exports.registerPlugins = registerPlugins;