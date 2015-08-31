'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _libJobInteractorJs = require('./lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _libUtilsJs = require('./lib/utils.js');

var _libConfigJs = require('./lib/config.js');

try {
  var config_path = (0, _libUtilsJs.firstExistingPath)([_path2['default'].join(process.env.HOME || '', './.config/explorer/config.yml'), _path2['default'].join(__dirname, './config.yml')]);

  var config = (0, _libConfigJs.getConfiguration)(config_path);
} catch (e) {
  console.log('No config file!');
  throw e;
}

var https_options = {
  key: _fs2['default'].readFileSync(config.https.key),
  cert: _fs2['default'].readFileSync(config.https.cert)
};

require('./server.js')(config).then(function (app) {
  _http2['default'].createServer(app).listen(config.port, function (e) {
    return !config.quiet ? console.log('HTTP listening on %s', config.port) : 1;
  });

  if (config.https.enabled) {
    _https2['default'].createServer(https_options, app).listen(config.https.port, function (e) {
      return !config.quiet ? console.log('HTTPS listening on %s', config.https.port) : 1;
    });
  }
});

var plugin_path = _path2['default'].join(__dirname, './lib/plugins');

_fs2['default'].readdirAsync(plugin_path).then(function (files) {
  files = files.map(function (f) {
    return _path2['default'].join(plugin_path, f);
  });

  if (_libJobInteractorJs2['default'].job) {
    console.error('Interactor already launched');
    return Promise.resolve();
  }

  return _libJobInteractorJs2['default'].run(files);
})['catch'](function (err) {
  console.error('Error while launching database');
  console.error(err.stack);
});