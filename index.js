'use strict';

try {
  var config = require('yamljs').load('./config.yml');

  if (!config.search) {
    config.search = {};
  }
} catch (e) {
  console.log('No config file!');
  throw e;
}

require('./server.js')(config).then(function (app) {
  return app.listen(config.port || 4859, function (e) {
    return console.log(config.port);
  });
});