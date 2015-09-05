import RSS from 'rss'
import os from 'os'

/**
 * rssTree if tree is requested as rss
 * Change object res.locals.tree to an xml feed
 */
function rssTree(req, res, next) {
  let host = req.protocol + '://' + req.get('host')

  let feed = new RSS({
    title: 'Explorer - ' + os.hostname(),
    description: 'File listing',
    feed_url: host + req.originalUrl,
    site_url: host,
    image_url: host + '/login.png',
    pubDate: Date.now(),
  })

  let tree = res.locals.tree

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

export default rssTree
