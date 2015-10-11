'use strict';
var RSS = require('rss')
var os = require('os')

/**
 * rssTree if tree is requested as rss
 * Change object res.locals.tree to an xml feed
 */
function rssTree(req, res, next) {
  var host = req.protocol + '://' + req.get('host')

  var feed = new RSS({
    title: 'Explorer - ' + os.hostname(),
    description: 'File listing',
    feed_url: host + req.originalUrl,
    site_url: host,
    image_url: host + '/login.png',
    pubDate: Date.now(),
  })

  var tree = res.locals.tree

  tree.forEach(function(e) {
    feed.item({
      title: e.name,
      description: e.path,
      url: host + '/download?path='+e.path+'&key='+req.user.key,
      date: e.mtime,
      custom: [{'explorer:size': e.size}, {'explorer:type': e.type}, {'explorer:ext': e.ext}]
    })
  })

  return res.send(feed.xml())
}

module.exports = rssTree
