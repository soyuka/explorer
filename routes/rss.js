'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _rss = require('rss');

var _rss2 = _interopRequireDefault(_rss);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

/**
 * rssTree if tree is requested as rss
 * Change object res.locals.tree to an xml feed
 */
function rssTree(req, res, next) {
  var host = req.protocol + '://' + req.get('host');

  var feed = new _rss2['default']({
    title: 'Explorer - ' + _os2['default'].hostname(),
    description: 'File listing',
    feed_url: host + req.originalUrl,
    site_url: host,
    image_url: host + '/login.png',
    pubDate: Date.now()
  });

  var tree = res.locals.tree;

  tree.forEach(function (e) {
    feed.item({
      title: e.name,
      description: e.path,
      url: host + '/download?path=' + e.path + '&key=' + req.user.key,
      date: e.mtime,
      custom: [{ 'explorer:size': e.size }, { 'explorer:type': e.type }, { 'explorer:ext': e.ext }]
    });
  });

  return res.send(feed.xml());
}

exports['default'] = rssTree;
module.exports = exports['default'];