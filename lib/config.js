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

function getConfiguration(config_path) {
  var config = require('yamljs').load(config_path);

  config_path = _path2['default'].dirname(config_path);

  if (!config.search) {
    config.search = {};
  }

  config.quiet = !! ~process.argv.indexOf('-q') || !! ~process.argv.indexOf('--quiet');

  config.database = _path2['default'].resolve(config_path, config.database);

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

  function resolveElement(element) {
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
  }

  config.remove = resolveElement(config.remove, {
    method: 'mv'
  });

  config.archive = resolveElement(config.archive, {
    keep: false
  });

  config.upload = resolveElement(config.upload, {
    concurrency: 10
  });

  return config;
}

exports.getConfiguration = getConfiguration;