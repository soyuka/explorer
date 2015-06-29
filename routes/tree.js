'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _libUtilsJs = require('../lib/utils.js');

var _libSortJs = require('../lib/sort.js');

var _libTreeJs = require('../lib/tree.js');

var _libSearchJs = require('../lib/search.js');

var archiver = require('archiver');
var p = require('path');
var debug = require('debug')('explorer:routes:tree');

/**
 * Prepare tree locals et validate queries 
 * @param config
 * @return function middleware(req, res, next)
 */
function prepareTree(config) {
  return function (req, res, next) {
    //should be an app.param
    if (!req.query.page || req.query.page < 0) req.query.page = 1;

    req.query.page = parseInt(req.query.page);

    if (req.query.sort) {
      if (!_libSortJs.sort.hasOwnProperty(req.query.sort)) {
        req.query.sort = null;
      }
    }

    if (! ~['asc', 'desc'].indexOf(req.query.order)) {
      req.query.order = 'asc';
    }

    if (!req.query.path) req.query.path = './';

    if (req.query.search && config.search.method !== 'native') {
      req.query.search = (0, _libUtilsJs.secureString)(req.query.search);
    }

    res.locals = (0, _libUtilsJs.extend)(res.locals, {
      search: req.query.search,
      sort: req.query.sort || '',
      order: req.query.order || '',
      page: req.query.page,
      root: p.resolve(req.user.home),
      path: (0, _libUtilsJs.higherPath)(req.user.home, req.query.path),
      parent: (0, _libUtilsJs.higherPath)(req.user.home, p.resolve(req.query.path, '..')),
      buildUrl: _libUtilsJs.buildUrl
    });

    req.options = (0, _libUtilsJs.extend)(res.locals, config.tree, config.pagination);

    if (res.locals.sort) req.options.sortMethod = _libSortJs.sort[res.locals.sort](req.options);

    debug('Options: %o', req.options);

    return next();
  };
}

/**
 * Compress paths with archiver
 * @route /compress
 */
function compress(req, res) {

  var paths = [];

  if (typeof req.body.zip == 'string') req.body.zip = [req.body.zip];

  //validating paths
  for (var i in req.body.zip) {
    var path = (0, _libUtilsJs.higherPath)(req.user.home, req.body.zip[i]);

    if (path != req.user.home) {
      try {
        var stat = fs.statSync(path);
      } catch (err) {
        return res.status(500).send(err);
      }

      if (stat.isDirectory()) {
        return res.status(501).send('Can not compress a directory');
      }

      paths.push(path);
    }
  }

  var archive = archiver('zip');
  var name = req.body.name || 'archive' + new Date().getTime();

  archive.on('error', function (err) {
    return res.status(500).send({ error: err.message });
  });

  //on stream closed we can end the request
  res.on('close', function () {
    console.log('Archive wrote %d bytes', archive.pointer());
    return res.status(200).send('OK');
  });

  //set the archive name
  res.attachment(name + '.zip');

  //this is the streaming magic
  archive.pipe(res);

  for (var i in paths) {
    archive.append(fs.createReadStream(paths[i]), { name: p.basename(paths[i]) });
  }

  archive.finalize();
}

/**
 * @route /download
 */
function download(req, res) {
  var path = (0, _libUtilsJs.higherPath)(req.user.home, req.query.path);

  if (path === req.user.home) {
    return res.status(401).send('Unauthorized');
  }

  return res.download(path, p.basename(path), function (err) {
    if (err) {
      console.error('Error %o', err);
      console.error('With headers %o', res.headersSent);
      return res.status(500).send('Error while downloading');
    }
  });
}

/**
 * Get the tree
 * @route /
 */
function getTree(req, res) {

  debug('Sort by %s %s', req.options.sort, req.options.order);

  (0, _libTreeJs.tree)(req.options.path, req.options).then(function (e) {
    return res.renderBody('tree.haml', e);
  })['catch'](function (error) {
    console.error(error);
    return res.status(500).send('Error while parsing tree at path: ' + req.options.path);
  });
}

/**
 * Search through config search method
 * @route /search
 */
function search(req, res) {
  var config = req.config;

  debug('Search with %s', config.search.method, req.options.search);

  (0, _libSearchJs.searchMethod)(config.search.method, config)(req.options.search, req.user.home).then(function (data) {
    data = data ? data : this.data.out;
    return (0, _libTreeJs.tree)([].concat.apply([], data), req.options);
  }).then(function (e) {
    return res.renderBody('tree.haml', (0, _libUtilsJs.extend)(e, { search: req.query.search }));
  });
}

var Tree = function Tree(app) {
  var pt = prepareTree(app.get('config'));

  app.get('/', pt, getTree);
  app.get('/search', pt, search);
  app.get('/download', download);
  app.post('/compress', compress);

  return app;
};

exports.Tree = Tree;