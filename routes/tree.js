'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _libUtilsJs = require('../lib/utils.js');

var _libTreeJs = require('../lib/tree.js');

var _libSearchJs = require('../lib/search.js');

var _middlewaresJs = require('./middlewares.js');

var fs = require('fs');
var archiver = require('archiver');
var rimraf = require('rimraf');
var p = require('path');
var debug = require('debug')('explorer:routes:tree');
var moment = require('moment');
var prettyBytes = require('pretty-bytes');

/**
 * Compress paths with archiver
 * @route /compress
 */
function compress(req, res) {

  var paths = [];
  var directories = [];

  if (typeof req.body.zip == 'string') req.body.zip = [req.body.zip];

  //validating paths
  for (var i in req.body.zip) {
    var path = (0, _libUtilsJs.higherPath)(req.options.root, req.body.zip[i]);

    if (path != req.options.root) {
      try {
        var stat = fs.statSync(path);
      } catch (err) {
        return res.status(500).send(err);
      }

      if (stat.isDirectory()) {
        directories.push(path);
      } else {
        paths.push(path);
      }
    }
  }

  var archive = archiver('zip');
  var name = req.body.name || 'archive' + new Date().getTime();
  var temp = p.join(req.options.archive.temp || './', name + '.zip');

  archive.on('error', function (err) {
    archive.abort();
    return res.status(500).send({ error: err.message });
  });

  //on stream closed we can end the request
  archive.on('end', function () {

    var b = archive.pointer();
    console.log('Archive wrote %d bytes', b);

    if (req.body.download === undefined && req.options.archive.keep) {
      req.flash('info', prettyBytes(b) + ' written in ' + temp);
      return res.redirect('back');
    }
  });

  //set the archive name
  res.attachment(name + '.zip');

  //this is the streaming magic
  if (req.body.download !== undefined || !req.options.archive.keep) {
    archive.pipe(res);
  }

  if (req.options.archive.keep) {
    archive.pipe(fs.createWriteStream(temp));
  }

  for (var i in paths) {
    archive.append(fs.createReadStream(paths[i]), { name: p.basename(paths[i]) });
  }

  for (var i in directories) {
    debug('Path : ', directories[i].replace(req.options.root, ''));
    archive.directory(directories[i], directories[i].replace(req.options.root, ''));
  }

  archive.finalize();
}

/**
 * @route /download
 */
function download(req, res) {
  var path = (0, _libUtilsJs.higherPath)(req.options.root, req.query.path);

  if (path === req.options.root) {
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
 * Deletes or moves a file
 */
function deletePath(req, res) {

  var path = (0, _libUtilsJs.higherPath)(req.options.root, req.query.path);

  debug('Deleting %s', path);

  var next = function next(err) {
    if (err) {
      console.error(err);
      req.flash('error', 'Delete failed');
    }

    return res.redirect('back');
  };

  if (path === req.options.root) {
    return res.status(401).send('Unauthorized');
  }

  if (!!req.user.readonly === true) {
    return res.status(401).send('Unauthorized');
  }

  if (req.options.remove.method == 'mv') {
    var t = p.join(req.options.remove.trash, p.basename(path) + '.' + moment().format('YYYYMMDDHHmmss'));
    return fs.rename(path, t, next);
  } else if (req.options.remove.method == 'rm') {
    return rimraf(path, next);
  } else {
    return res.status(403).send('Forbidden');
  }
}

/**
 * Search through config search method
 * @route /search
 */
function search(req, res) {
  var config = req.config;

  debug('Search with %s', config.search.method, req.options.search);

  (0, _libSearchJs.searchMethod)(config.search.method, config)(req.options.search, req.options.root).then(function (data) {
    data = data ? data : this.data.out;
    return (0, _libTreeJs.tree)([].concat.apply([], data), req.options);
  }).then(function (e) {
    return res.renderBody('tree.haml', (0, _libUtilsJs.extend)(e, { search: req.query.search }));
  });
}

function emptyTrash(req, res, next) {

  if (!req.options.remove || req.options.remove.method !== 'mv') {
    return res.status(403).send('Forbidden');
  }

  if (req.options.remove.trash == req.options.root) {
    return res.status(417).send('Won\'t happend');
  }

  debug('Empty trash %s', req.options.remove.trash);

  (0, _libUtilsJs.removeDirectoryContent)(req.options.remove.trash).then(function () {
    return res.redirect('back');
  })['catch'](function (err) {
    console.error(err);
    res.status(500, 'Error while emptying trash');
  });
}

var Tree = function Tree(app) {
  var config = app.get('config');
  var pt = (0, _middlewaresJs.prepareTree)(config);

  app.get('/', pt, getTree);
  app.get('/search', pt, search);
  app.get('/download', pt, download);
  app.post('/compress', pt, compress);
  app.post('/trash', pt, emptyTrash);
  app.get('/remove', pt, deletePath);

  return app;
};

exports.Tree = Tree;