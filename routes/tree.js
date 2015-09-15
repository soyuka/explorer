'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _libUtilsJs = require('../lib/utils.js');

var _libHTTPErrorJs = require('../lib/HTTPError.js');

var _libHTTPErrorJs2 = _interopRequireDefault(_libHTTPErrorJs);

var _libTreeJs = require('../lib/tree.js');

var _libSearchJs = require('../lib/search.js');

var _middlewares = require('../middlewares');

var _libJobInteractorJs = require('../lib/job/interactor.js');

var _libJobInteractorJs2 = _interopRequireDefault(_libJobInteractorJs);

var debug = require('debug')('explorer:routes:tree');
var fs = _bluebird2['default'].promisifyAll(require('fs'));

/**
 * @api {get} /download Download path
 * @apiGroup Tree
 * @apiName Download
 * @apiParam {string} path
 */
function download(req, res, next) {
  var path = (0, _libUtilsJs.higherPath)(req.options.root, req.query.path);

  if (path === req.options.root) {
    return next(new _libHTTPErrorJs2['default']('Unauthorized', 401));
  }

  return _bluebird2['default'].join(fs.statAsync(path), (0, _libUtilsJs.pathInfo)(path), function (stat, info) {
    if (stat.isDirectory()) {
      return next(new _libHTTPErrorJs2['default']('Downloading a directory is not possible', 400));
    }

    if (~['image', 'text'].indexOf(info.type)) {

      debug('SendFile %o', info);

      var options = {
        root: req.options.root,
        maxAge: '5h',
        dotfiles: 'deny',
        lastModified: stat.mtime
      };

      return res.sendFile(_path2['default'].relative(options.root, path), options, function (err) {
        if (err) {
          return (0, _libUtilsJs.handleSystemError)(next)(err);
        }
      });
    }

    debug('Download %o', info);

    return res.download(path, _path2['default'].basename(path), function (err) {
      if (err) {
        return (0, _libUtilsJs.handleSystemError)(next)(err);
      }
    });
  })['catch'](function (err) {
    if (err) {
      return (0, _libUtilsJs.handleSystemError)(next)(err);
    }
  });
}

/**
 * @api {get} / Get the tree
 * @apiGroup Tree
 * @apiName Tree
 * @apiParam {string} path
 * @apiParam {string} sort
 * @apiParam {string} order
 */
function getTree(req, res, next) {

  debug('Sort by %s %s', req.options.sort, req.options.order);

  (0, _libTreeJs.tree)(req.options.path, req.options).then(function (e) {
    res.locals = (0, _libUtilsJs.extend)(res.locals, e);
    return next();
  })['catch'](function (err) {
    console.error('Error while parsing tree at path: ' + req.options.path);
    return (0, _libUtilsJs.handleSystemError)(next)(err);
  });
}

/**
 * @api {get} /remove Deletes or moves a file
 * @apiGroup Tree
 * @apiName Remove
 * @apiParam {string} path
 */
function deletePath(req, res, next) {

  var opts = req.options;
  var path = opts.path;

  if (path == opts.root || path == req.user.home) {
    return next(new _libHTTPErrorJs2['default']('Forbidden', 403));
  }

  if (!!req.user.readonly === true || opts.remove.disabled || ! ~['mv', 'rm'].indexOf(opts.remove.method)) {
    return next(new _libHTTPErrorJs2['default']('Unauthorized', 401));
  }

  if (~path.indexOf(opts.remove.path)) {
    return next(new _libHTTPErrorJs2['default']('Not acceptable', 406));
  }

  debug('Deleting %s', path);

  var cb = function cb(err, newPath) {
    if (err) {
      return (0, _libUtilsJs.handleSystemError)(next)(err);
    }

    return res.handle('back', newPath ? { path: newPath, moved: true } : { removed: true });
  };

  if (opts.remove.method == 'rm') {
    return (0, _rimraf2['default'])(path, cb);
  } else {
    var _ret = (function () {
      var t = _path2['default'].join(opts.remove.path, _path2['default'].basename(path) + '.' + (0, _moment2['default'])().format('YYYYMMDDHHmmss'));
      return {
        v: fs.rename(path, t, function (err) {
          return cb(err, t);
        })
      };
    })();

    if (typeof _ret === 'object') return _ret.v;
  }
}

/**
 * @api {get} /search Search according to the configuration method
 * @apiGroup Tree
 * @apiName Search
 * @apiParam {string} search
 */
function search(req, res, next) {
  var config = req.config;

  debug('Search with %s, %s', config.search.method, req.options.search, req.options.path);

  (0, _libSearchJs.searchMethod)(config.search.method, req.options)(req.options.search, req.options.path, req.options.root).then(function (data) {
    if (config.search.method == 'native') {
      return data;
    } else {
      return (0, _libTreeJs.tree)([].concat.apply([], this.data.out), req.options);
    }
  }).then(function (e) {
    res.locals = (0, _libUtilsJs.extend)(res.locals, e, { search: req.query.search });
    return next();
  })['catch']((0, _libUtilsJs.handleSystemError)(next));
}

function render(req, res, next) {
  return res.renderBody('tree.haml');
}

/**
 * @api {post} /trash Empty trash
 * @apiGroup User
 * @apiName emptyTrash
 */
function emptyTrash(req, res, next) {

  var opts = req.options;

  if (opts.remove.disabled || opts.remove.method !== 'mv') {
    return (0, _libUtilsJs.handleSystemError)(next)('Forbidden', 403);
  }

  if (opts.remove.path == opts.root) {
    return (0, _libUtilsJs.handleSystemError)(next)("Won't happend", 417);
  }

  debug('Empty trash %s', opts.remove.path);

  (0, _libUtilsJs.removeDirectoryContent)(opts.remove.path).then(function () {
    req.flash('info', 'Trash is now empty!');
    return res.handle('back');
  })['catch']((0, _libUtilsJs.handleSystemError)(next));
}

/**
 * @api {post} / Action path (upload, archive, plugins)
 * @apiGroup Tree
 * @apiName compress
 * @apiParam {string[]} paths Array of paths and directories
 * @apiParam {string} [name="archive-Date.getTime()"] Archive name
 * @apiParam {string} action Download, archive, remove (see plugins docs)
 */
function treeAction(app) {
  var plugins = app.get('plugins');

  return function (req, res, next) {

    if (!req.body.action) {
      return (0, _libUtilsJs.handleSystemError)(next)("Action is needed", 400);
    }

    var action = req.body.action.split('.');
    var plugin = action.shift();
    var actionName = action.shift();

    if (!(plugin in plugins)) {
      return new _libHTTPErrorJs2['default']('Plugin ' + plugin + ' not found', 404);
    }

    //we're on POST /, /p/pluginName/action/actionName
    req.url = _path2['default'].join(req.url, 'p', plugin, 'action', actionName);

    return app._router.handle(req, res, next);
  };
}

var Tree = function Tree(app) {
  var pt = (0, _middlewares.prepareTree)(app);

  app.post('/', pt, _middlewares.sanitizeCheckboxes, treeAction(app));
  app.get('/', pt, getTree, render);
  app.get('/search', pt, search, render);
  app.get('/download', pt, download);
  app.post('/trash', pt, emptyTrash);
  app.get('/remove', pt, deletePath);

  return app;
};

exports.Tree = Tree;