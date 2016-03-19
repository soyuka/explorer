'use strict';
const fs = require('fs')
const p = require('path')
const clipboard = p.join(__dirname, './clipboard.haml')
const PassThrough = require('stream').PassThrough
const jhaml = require('@soyuka/jhaml')
const cacheStream = require('cache-stream')

function registerHooks(config, utils) {
  const memory = new utils.notify('clipboard', utils.cache)
  const cache = cacheStream()

  fs.createReadStream(clipboard)
  .pipe(jhaml.tohtml())
  .pipe(cache)

  function actionHook() {
    var str = `
      <optgroup label="Copy">
        <option value="move.copy">Copy</option>
        <option value="move.cut">Cut</option>
    `

    if(!config.remove.disabled)
       str += '<option value="move.remove">Remove</option>'


    str += '</optgroup>'

    return str
  }

  return {
    action: {
      template: actionHook()
    },
    above: {
      template: function() {
        let through = new PassThrough
        return cache.pipe(through)
      },
      scope: function aboveScope(req, res) {
        return memory.get(req.user.username)
        .then(paths => {
          return {clipboard: paths} 
        })
      }
    }
  }
}

module.exports = registerHooks
