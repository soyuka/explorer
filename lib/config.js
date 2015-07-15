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

  // Remove options
  if (!config.remove) {
    config.remove = {};
  }

  config.remove.trash = _path2['default'].resolve(config_path, config.remove.trash || './trash');

  //@TODO warn error !
  if (!_fs2['default'].existsSync(config.remove.trash)) {
    _mkdirp2['default'].sync(config.remove.trash);
  }

  config.remove = _util2['default']._extend({
    method: 'mv'
  }, config.remove);

  // Archive options
  if (!config.archive) {
    config.archive = {};
  }

  config.archive.temp = _path2['default'].resolve(config_path, config.archive.temp || './tmp');

  if (!_fs2['default'].existsSync(config.archive.temp)) {
    _mkdirp2['default'].sync(config.archive.temp);
  }

  config.archive = _util2['default']._extend({
    keep: false
  }, config.archive);

  return config;
}

exports.getConfiguration = getConfiguration;