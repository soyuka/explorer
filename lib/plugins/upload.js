'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _download = require('download');

var _download2 = _interopRequireDefault(_download);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _jobStatJs = require('../job/stat.js');

var _jobStatJs2 = _interopRequireDefault(_jobStatJs);

var _prettyBytes = require('pretty-bytes');

var _prettyBytes2 = _interopRequireDefault(_prettyBytes);

var _isNumber = require('is-number');

var _isNumber2 = _interopRequireDefault(_isNumber);

var stat = new _jobStatJs2['default']('upload');
var download = new _download2['default']();
var debug = require('debug')('explorer:job:upload');

/**
 * Requests the url, downloads to dest and stat notifications
 * @param string url
 * @param string destination
 * @return Promise
 */
function requestAsync(url, destination) {
  var size = 0;
  var filename = undefined;

  return new _bluebird2['default'](function (resolve, reject) {
    debug('Requesting', url);

    var d = require('download');

    new _download2['default']().get(url).dest(destination).rename(function (file) {
      filename = file.basename + file.extname;

      //rename if exists
      if (_fs2['default'].existsSync(_path2['default'].join(destination, filename))) {
        file.basename += '-' + Date.now();
        filename = file.basename + file.extname;
      }
    }).run(function (err, files) {

      //this is an upload error and is not considered as a system error
      if (err || !files) {
        console.error(err.message);
        return resolve({ error: 'Upload of ' + url + ' failed: ' + err.message });
      }

      var file = files[0];

      if (!file.basename) file.basename = filename;

      size = file.stat.size;

      if (file.isBuffer() && size <= 0) {
        size = file.contents.length;
      }

      if (size > 0) {
        return resolve({ path: destination, name: file.basename, message: url + ' was uploaded successfully to ' + file.path + ' (' + (0, _prettyBytes2['default'])(size) + ')' });
      }

      debug('No size');

      _fs2['default'].stat(file.path, function (err, fstat) {
        if (err) {
          return reject(err);
        }

        size = fstat.size;
        return resolve({ path: destination, name: file.basename, message: url + ' was uploaded successfully to ' + file.path + ' (' + (0, _prettyBytes2['default'])(size) + ')' });
      });
    });
  });
}

/**
 * Upload plugin
 * @param IPCEE ipc
 */
function Upload(ipc) {
  if (!(this instanceof Upload)) {
    return new Upload(ipc);
  }
  this.ipc = ipc;
}

/**
 * Creates remote uploads
 * @param array urls
 * @param Object user
 * @param Object config
 */
Upload.prototype.create = function (urls, user, config) {
  var self = this;

  stat.add(user.username, { message: 'Downloading ' + urls.join(', ') + ' to ' + config.upload.path });

  return _bluebird2['default'].map(urls, function (e) {
    return requestAsync(e, config.upload.path);
  }, { concurrency: config.concurrency || 10 }).then(function (data) {
    self.ipc.send('upload.create', user.username, data);
    return stat.add(user.username, data);
  })['catch'](function (err) {
    console.error(err.message);
    console.error(err.stack);
    self.ipc.send('upload.error', user.username, err.stack);
    return stat.add(user.username, { error: err.message });
  });
};

/**
 * Upload stat info
 * @return Stat
 */
Upload.prototype.info = function () {
  return stat.get();
};

Upload.prototype.clear = function (user) {
  return stat.remove(user);
};

exports['default'] = Upload;
module.exports = exports['default'];