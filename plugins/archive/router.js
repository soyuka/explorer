'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _jobJs = require('./job.js');

var _jobJs2 = _interopRequireDefault(_jobJs);

var _libJobStatJs = require('../../lib/job/stat.js');

var _libJobStatJs2 = _interopRequireDefault(_libJobStatJs);

var debug = require('debug')('explorer:routes:archive');

var Upload = function Upload(router, utils) {

  function getData(req) {
    var name = req.body.name || 'archive' + new Date().getTime();
    var temp = _path2['default'].join(req.options.archive.path || './', name + '.zip');

    return {
      name: name,
      paths: req.options.paths,
      temp: temp,
      directories: req.options.directories,
      root: req.options.root
    };
  }

  router.post('/action/download', function (req, res, next) {
    var data = getData(req);
    data.stream = res;
    var stat = new _libJobStatJs2['default']('archive');

    var archive = new _jobJs2['default'](null, stat);
    return archive.create(data, req.user, req.options);
  });

  router.post('/action/compress', function (req, res, next) {
    if (req.options.archive.disabled) return next(new HTTPError('Unauthorized', 401));

    var data = getData(req);
    data.stream = data.temp;
    utils.interactor.ipc.send('call', 'archive.create', data, req.user, req.options);
    return res.handle('back', { info: 'Archive created' }, 201);
  });

  return router;
};

exports['default'] = Upload;
module.exports = exports['default'];