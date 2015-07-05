var p = require('path')
var http = require('http')
var https = require('https')
var fs = require('fs')

import {firstExistingPath} from './lib/utils.js'
import {getConfiguration} from './lib/config.js'

try {
  let config_path = firstExistingPath([
    p.join(process.env.HOME || '', './.config/explorer/config.yml'), 
    p.join(__dirname, './config.yml')
  ])

  var config = getConfiguration(config_path)
} catch(e) {
  console.log('No config file!')
  throw e
}

let https_options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
}

require('./server.js')(config)
.then(function(app) {
  http.createServer(app).listen(config.port, e => console.log('HTTP listening on %s', config.port))

  if(config.https.enabled) {
    https.createServer(https_options, app).listen(config.https.port, e => console.log('HTTPS listening on %s', config.https.port))
  }
}) 
