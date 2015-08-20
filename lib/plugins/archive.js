'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _prettyBytes = require('pretty-bytes');

var _prettyBytes2 = _interopRequireDefault(_prettyBytes);

var _jobStatJs = require('../job/stat.js');

var _jobStatJs2 = _interopRequireDefault(_jobStatJs);

var debug = require('debug')('explorer:job:archive');

var stat = new _jobStatJs2['default']('archive');

function Archive() {
  var ipc = arguments[0] === undefined ? null : arguments[0];

  if (!(this instanceof Archive)) {
    return new Archive(ipc);
  }
  this.ipc = ipc;
}

/**
 * Creates an archive
 * @see routes/tree.js
 * data : {
 *   name, temp, directories, paths, root, stream (string|http.ServerResponse), options (req.options)
 * }
 */
Archive.prototype.create = function (data, user, config) {
  var archive = (0, _archiver2['default'])('zip');
  var self = this;

  archive.on('error', function (err) {
    archive.abort();
    if (!(data.stream instanceof _http2['default'].ServerResponse)) {
      self.ipc.send('archive.error', err.stack);
      return stat.add(user.username, { error: err.message });
    } else {
      return data.stream.status(500).send(err);
    }
  });

  //on stream closed we can end the request
  archive.on('end', function () {
    var b = archive.pointer();

    debug('Archive wrote %d bytes', b);

    if (!(data.stream instanceof _http2['default'].ServerResponse)) {
      self.ipc.send('archive.create', user.username, data);
      return stat.add(user.username, { message: '' + (0, _prettyBytes2['default'])(b) + ' written in ' + data.temp, path: _path2['default'].dirname(data.temp), name: data.name });
    }
  });

  if (data.stream instanceof _http2['default'].ServerResponse) {
    //set the archive name
    data.stream.attachment('' + data.name + '.zip');
  } else if (typeof data.stream == 'string') {

    data.stream = _fs2['default'].createWriteStream(data.stream);
    stat.add(user.username, { message: 'Compressing data from ' + data.root + ' to ' + data.temp, name: data.name });
  }

  archive.pipe(data.stream);

  for (var i in data.paths) {
    archive.append(_fs2['default'].createReadStream(data.paths[i]), { name: _path2['default'].basename(data.paths[i]) });
  }

  for (var i in data.directories) {
    archive.directory(data.directories[i], data.directories[i].replace(data.options.root, ''));
  }

  archive.finalize();
};

Archive.prototype.info = function () {
  return stat.get();
};

Archive.prototype.clear = function (user) {
  return stat.remove(user);
};

exports['default'] = Archive;
module.exports = exports['default'];