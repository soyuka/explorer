'use strict';
var p = require('path')
var http = require('http')
var https = require('https')
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'))

var config = require('./lib/config.js')()
var Worker = require('./lib/job/worker.js')

var https_options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
}

require('./server.js')(config, new Worker())
.then(function(app) {
  var plugins = app.get('plugins')
  var cache = app.get('cache')

  var server = http.createServer(app)
  .listen(config.port, function() {
    if(!config.quiet)
      console.log('HTTP listening on %s', config.port)
  })

  var socket = require('./lib/socket.js')(server, app)

  if(config.https.enabled) {
    var httpsServer = https.createServer(https_options, app)
    .listen(config.https.port, function() {
      if(!config.quiet)
      console.log('HTTPS listening on %s', config.https.port)
    })

    var httpssocket = require('./lib/socket.js')(server, app)
  }

  let worker = app.get('worker')

  worker.on('error', function(err) {
    console.error('Interactor errored'); 
    console.error(err); 
  })

  return worker.run()
  .then(e => worker.register([socket, httpssocket], app.get('plugins_cache')))
}) 
.catch(function(err) {
  console.error('Error while initializing explorer') 
  console.error(err.stack)
})
