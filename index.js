'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _libJobInteractorJs = require('./lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _libUtilsJs = require('./lib/utils.js');

var _libConfigJs = require('./lib/config.js');

var fs = _bluebird2['default'].promisifyAll(require('fs'));

var argv = require('minimist')(process.argv.slice(2));

try {
  var config_path = (0, _libUtilsJs.firstExistingPath)([argv.c, _path2['default'].join(process.env.HOME || '', './.config/explorer/config.yml'), _path2['default'].join(__dirname, './config.yml')]);

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
  _http2['default'].createServer(app).listen(config.port, function (e) {
    return !config.quiet ? console.log('HTTP listening on %s', config.port) : 1;
  });

  if (config.https.enabled) {
    _https2['default'].createServer(https_options, app).listen(config.https.port, function (e) {
      return !config.quiet ? console.log('HTTPS listening on %s', config.https.port) : 1;
    });
  }

  var plugins = app.get('plugins');
  var plugins_paths = [];

  for (var i in plugins) {
    if ('job' in plugins[i]) {
      plugins_paths.push(plugins[i].path);
    }
  }

  if (_libJobInteractorJs2['default'].job) {
    console.error('Interactor already launched');
    return _bluebird2['default'].resolve();
  }

  return _libJobInteractorJs2['default'].run(plugins_paths);
})['catch'](function (err) {
  console.error('Error while initializing explorer');
  console.error(err.stack);
});