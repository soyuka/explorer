'use strict';

var _libUtilsJs = require('./lib/utils.js');

var p = require('path');
var http = require('http');
var https = require('https');
var util = require('util');
var fs = require('fs');

try {
  var config_path = (0, _libUtilsJs.firstExistingPath)([p.join(process.env.HOME || '', './.config/explorer/config.yml'), p.join(__dirname, './config.yml')]);

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

  if (!config.remove) {
    config.remove = {};
  }

  config.remove.trash = p.resolve(config_path, config.remove.trash || './trash');

  config.remove = util._extend({
    method: 'mv'
  }, config.remove);

  if (!config.port) config.port = 4859;
} catch (e) {
  console.log('No config file!');
  throw e;
}

var https_options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
};

require('./server.js')(config).then(function (app) {
  http.createServer(app).listen(config.port, function (e) {
    return console.log('HTTP listening on %s', config.port);
  });

  if (config.https.enabled) {
    https.createServer(https_options, app).listen(config.https.port, function (e) {
      return console.log('HTTPS listening on %s', config.https.port);
    });
  }
});