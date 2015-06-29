'use strict';

var _libUtilsJs = require('./lib/utils.js');

var p = require('path');

try {
  var config_path = (0, _libUtilsJs.firstExistingPath)([p.join(process.env.HOME, './.config/explorer/config.yml'), p.join(__dirname, './config.yml')]);

  var config = require('yamljs').load(config_path);

  if (!config.search) {
    config.search = {};
  }

  config.database = p.resolve(p.dirname(config_path), config.database);

  if (!config.port) config.port = 4859;
} catch (e) {
  console.log('No config file!');
  throw e;
}

require('./server.js')(config).then(function (app) {
  return app.listen(config.port, function (e) {
    return console.log(config.port);
  });
});