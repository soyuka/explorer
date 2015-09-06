'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jobJs = require('./job.js');

var _jobJs2 = _interopRequireDefault(_jobJs);

var _libJobInteractorJs = require('../../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var _hooksJs = require('./hooks.js');

var _hooksJs2 = _interopRequireDefault(_hooksJs);

var _libHTTPErrorJs = require('../../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function getData(req) {
  var name = req.body.name || 'archive' + new Date().getTime();
  var temp = _path2['default'].join(req.options.archive.path || './', '' + name + '.zip');

  return {
    name: name,
    paths: req.options.paths,
    temp: temp,
    directories: req.options.directories,
    root: req.options.root
  };
}

module.exports = {
  actionMethods: ['download', 'compress'], //security check
  download: function download(req, res, next) {
    var data = getData(req);
    data.stream = res;

    var archive = new _jobJs2['default'](null, this.stat);
    return archive.create(data, req.user, req.options);
  },
  compress: function compress(req, res, next) {
    if (req.options.archive.disabled) return next(new _libHTTPErrorJs2['default']('Unauthorized', 401));

    var data = getData(req);
    data.stream = data.temp;
    _libJobInteractorJs2['default'].ipc.send('call', 'archive.create', data, req.user, req.options);
    return res.handle('back', { info: 'Archive created' }, 201);
  },
  job: _jobJs2['default'],
  hooks: _hooksJs2['default']
};