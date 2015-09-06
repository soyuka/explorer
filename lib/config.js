'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

/**
 * ResolveElement
 * For plugins, make sure they have a path
 * If falsy, set disable: true
 * Creates directory if the element path can't be found
 * @param object element
 * @param object opts defaults
 * @return object
 */
function getResolveElement(config_path) {
  return function (element) {
    var opts = arguments[1] === undefined ? {} : arguments[1];

    if (!element) {
      element = { disabled: true };
    }

    if ('path' in element) {
      element.path = _path2['default'].resolve(config_path, element.path || './trash');

      if (!_fs2['default'].existsSync(element.path)) {
        _mkdirp2['default'].sync(element.path);
      }
    }

    element = _util2['default']._extend(opts, element);

    return element;
  };
}

/**
 * Load yaml configuration and normalize it
 * @param string config_path
 * @return object configuration
 */
function getConfiguration(config_path) {
  var config = require('yamljs').load(config_path);

  config.config_path = config_path = _path2['default'].dirname(config_path);

  var resolveElement = getResolveElement(config_path);

  config.plugin_path = _path2['default'].join(__dirname, '../plugins');

  if (!config.plugins) config.plugins = {};

  config.plugins = _util2['default']._extend(config.plugins, { upload: {}, archive: {} });

  if (!config.search) {
    config.search = { method: 'native' };
  }

  config.quiet = !! ~process.argv.indexOf('-q') || !! ~process.argv.indexOf('--quiet');

  config.database = _path2['default'].resolve(config_path, config.database || './data/users');

  if (!config.https) {
    config.https = {};
  }

  config.https.key = _path2['default'].resolve(config_path, config.https.key || './certs/key.pem');
  config.https.cert = _path2['default'].resolve(config_path, config.https.cert || './certs/cert.pem');

  config.https = _util2['default']._extend({
    port: 6859,
    enabled: true
  }, config.https);

  if (!config.port) config.port = 4859;

  config.remove = resolveElement(config.remove, {
    method: 'mv'
  });

  config.archive = resolveElement(config.archive);

  config.upload = resolveElement(config.upload, {
    concurrency: 10,
    maxSize: '50mb',
    maxCount: 10
  });

  return config;
}

exports.getConfiguration = getConfiguration;