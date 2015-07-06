'use strict';

var _libUtilsJs = require('./lib/utils.js');

var _libConfigJs = require('./lib/config.js');

var p = require('path');
var http = require('http');
var https = require('https');
var fs = require('fs');

try {
  var config_path = (0, _libUtilsJs.firstExistingPath)([p.join(process.env.HOME || '', './.config/explorer/config.yml'), p.join(__dirname, './config.yml')]);

  var config = (0, _libConfigJs.getConfiguration)(config_path);
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