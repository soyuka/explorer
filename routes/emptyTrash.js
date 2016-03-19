'use strict'
var Promise = require('bluebird')
var utils = require('../lib/utils.js')
var tree = require('../lib/tree.js')
var resolveSources = require('../lib/resolveSources.js')
var sanitizeCheckboxes = Promise.promisify(require('../middlewares').sanitizeCheckboxes)
var prepareTree = Promise.promisify(require('../middlewares').prepareTree)

/**
 * @api {post} /trash Empty trash
 * @apiGroup User
 * @apiName emptyTrash
 */
function emptyTrash(app, path) {
  let move = app.get('worker').task('move')

  return function(req, res, next) {
    let opts = req.options

    if(opts.remove.disabled || opts.remove.method !== 'mv') {
      return utils.handleSystemError(next)('Forbidden', 403)
    }

    if(path == opts.root) {
      return utils.handleSystemError(next)("Won't happend", 417)
    }

    opts.limit = Infinity

    tree(path, opts)
    .then(function(tree) {
      move.call('remove', req.user, tree.tree.map(function(item) {
        return item.path
      }))
    })

    return res.handle({info: 'Removing'}, 202)
  }
}

module.exports = emptyTrash
