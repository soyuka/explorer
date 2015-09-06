'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _libHTTPErrorJs = require('../../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _middlewares = require('../../middlewares');

var _libJobInteractorJs = require('../../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var debug = require('debug')('explorer:routes:upload');

function getUpload(req, res, next) {
  return res.renderBody('upload.haml', req.options);
}

/**
 * @api {post} /remote-upload Remote Upload
 * @apiGroup Upload
 * @apiName remoteUpload
 * @apiParam {string} links Links to download
 */
function remoteUpload(req, res, next) {
  var links = req.body.links.split('\r\n');

  links = links.filter(function (e) {
    return e.trim().length > 0;
  });

  if (links.length > req.options.upload.maxCount) {
    return next(new _libHTTPErrorJs2['default']('Max number of files exceeded (' + req.options.upload.maxCount + ')', 400));
  }

  _libJobInteractorJs2['default'].ipc.send('call', 'upload.create', links, req.user, req.options);

  return res.handle('back', { info: 'Upload launched' }, 201);
}

function canUpload(req, res, next) {
  var opts = req.options.upload;

  if (opts.disabled) return next(new _libHTTPErrorJs2['default']('Unauthorized', 401));

  return next();
}

var Upload = function Upload(app) {

  //Hacking views directory
  var views = app.get('views');
  views.push(_path2['default'].join(__dirname, 'views'));
  app.set('views', views);

  var config = app.get('config');
  var pt = (0, _middlewares.prepareTree)(app);

  var storage = _multer2['default'].diskStorage({
    destination: function destination(req, file, cb) {
      return cb(null, req.options.upload.path);
    },
    filename: function filename(req, file, cb) {

      var original = file.originalname;
      var ext = _path2['default'].extname(original);
      var name = _path2['default'].basename(original, ext);

      //rename if exists
      if (_fs2['default'].existsSync(_path2['default'].join(req.options.upload.path, original))) {
        original = name + '-' + Date.now() + ext;
      }

      return cb(null, original);
    }
  });

  /**
   * @api {post} /upload Upload
   * @apiGroup Upload
   * @apiName upload
   * @apiParam {string[]} files
   */
  var upload = (0, _multer2['default'])({ storage: storage });

  app.get('/upload', pt, canUpload, getUpload);
  app.post('/upload', pt, canUpload, upload.array('files', config.upload.maxCount), function (req, res, next) {
    var info = '';

    if (req.files.length == 1) {
      info = '' + req.files[0].originalname + ' uploaded to ' + req.files[0].path;
    } else {
      info = '' + req.files.length + ' files uploaded to ' + req.options.upload.path;
    }

    return res.handle('upload', { info: info }, 200);
  });

  /**
   * @api {post} /remote-upload Remote Upload
   * @apiGroup Upload
   * @apiName remoteUpload
   * @apiParam {string[]} links One link by line
   */
  app.post('/remote-upload', pt, canUpload, remoteUpload);

  return app;
};

exports['default'] = Upload;
module.exports = exports['default'];