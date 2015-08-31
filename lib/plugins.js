'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var fs = _bluebird2['default'].promisifyAll(require('fs'));

var plugin_path = _path2['default'].join(__dirname, '../plugins');

function Plugins(config) {
  this.plugins = config.plugins;

  for (var i in this.plugins) {
    var path = _path2['default'].join(plugin_path, this.plugins[i]);
    if (fs.existsSync(path)) {
      this.plugins[i] = require(path);
      continue;
    }

    if (fs.existsSync(this.plugins[i])) {
      this.plugins[i] = require(this.plugins[i]);
      continue;
    }

    console.error('Can not load %s', this.plugins[i]);
  }
}

// fs.readdirAsync(plugin_path)
// .then(function(files) {
//   files = files.map(f => p.join(plugin_path, f))
//
//   if(interactor.job) {
//     console.error('Interactor already launched')
//     return Promise.resolve()
//   }
//
//   return interactor.run(files)
// })
// .catch(function(err) {
//   console.error('Error while launching database')
//   console.error(err.stack)
// })

exports['default'] = Plugins;
module.exports = exports['default'];