"use strict";
var Notify = require('../../lib/job/notify.js')
var fs = require('fs')
var p = require('path')
var hamljs = require('hamljs')
var clipboard = fs.readFileSync(p.join(__dirname, './clipboard.haml'))

function registerHooks(config, url, user) {
  var cache = require('../../lib/cache')(config)
  var memory = new Notify('clipboard', cache)

  return memory.get(user.username)
  .then(function(paths) {
    return {
      action: function(tree) {
        var str = `
          <optgroup label="Copy">
            <option value="move.copy">Copy</option>
            <option value="move.cut">Cut</option>
          </optgroup>`

        return str
      },
      directory: function(tree, path) {
        if(!paths || paths.length == 0)
          return ''

        return hamljs.render(clipboard, {locals: {
          paths: paths,
          url: url,
          path: path
        }})
      }
    }
  })
}

module.exports = registerHooks
