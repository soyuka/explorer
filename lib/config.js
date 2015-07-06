'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var p = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var fs = require('fs');

function getConfiguration(config_path) {
  var config = require('yamljs').load(config_path);

  config_path = p.dirname(config_path);

  if (!config.search) {
    config.search = {};
  }

  config.database = p.resolve(config_path, config.database);

  if (!config.https) {
    config.https = {};
  }

  config.https.key = p.resolve(config_path, config.https.key || './certs/key.pem');
  config.https.cert = p.resolve(config_path, config.https.cert || './certs/cert.pem');

  config.https = util._extend({
    port: 6859,
    enabled: true
  }, config.https);

  if (!config.port) config.port = 4859;

  // Remove options
  if (!config.remove) {
    config.remove = {};
  }

  config.remove.trash = p.resolve(config_path, config.remove.trash || './trash');

  if (!fs.existsSync(config.remove.trash)) {
    mkdirp.sync(config.remove.trash);
  }

  config.remove = util._extend({
    method: 'mv'
  }, config.remove);

  // Archive options
  if (!config.archive) {
    config.archive = {};
  }

  config.archive.temp = p.resolve(config_path, config.archive.temp || './tmp');

  if (!fs.existsSync(config.archive.temp)) {
    mkdirp.sync(config.archive.temp);
  }

  config.archive = util._extend({
    keep: false
  }, config.archive);

  return config;
}

exports.getConfiguration = getConfiguration;