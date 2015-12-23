'use strict';
var fs = require('fs')
var p = require('path')
var hamljs = require('hamljs')
var clipboard = fs.readFileSync(p.join(__dirname, './clipboard.haml'))

function registerHooks(config, user, utils) {
  var memory = new utils.notify('clipboard', utils.cache)

  return memory.get(user.username)
  .then(function(paths) {
    return {
      action: function() {
        var str = `
          <optgroup label="Copy">
            <option value="move.copy">Copy</option>
            <option value="move.cut">Cut</option>
        `

        if(!config.remove.disabled)
           str += '<option value="move.remove">Remove</option>'


        str += '</optgroup>'

        return str
      },
      above: function(tree, path) {
        if(!paths || paths.length == 0)
          return ''

        return hamljs.render(clipboard, {locals: {
          paths: paths,
          path: path
        }})
      }
    }
  })
}

module.exports = registerHooks
