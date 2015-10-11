"use strict";
var p = require('path')
var http = require('http')
var https = require('https')
var Promise = require('bluebird')
var interactor = require('./lib/job/interactor.js')
var fs = Promise.promisifyAll(require('fs'))

var config = require('./lib/config.js')()

var https_options = {
  key: fs.readFileSync(config.https.key),
  cert: fs.readFileSync(config.https.cert)
}

require('./server.js')(config)
.then(function(app) {
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
  
  var plugins = app.get('plugins')
  var plugins_paths = []

  for(let i in plugins) {
    if('job' in plugins[i]) {
      plugins_paths.push(plugins[i].path) 
    }
  }

  if(interactor.job) {
    console.error('Interactor already launched')
    return Promise.resolve()
  }

  interactor.on('error', function(err) {
    console.error('Interactor errored'); 
    console.error(err); 
  })

  return interactor.run(plugins_paths, config)
  .then(function() {
    interactor.ipc.on('notify:*', function(data) {
      var event = this.event
      setTimeout(function() {
        let num = data.length
        let d = data.pop()
        d.num = num

        socket.publish('/'+event.replace(':', '/'), d)

        if(httpssocket) {
          httpssocket.publish('/'+event.replace(':', '/'), d) 
        }
      }, 1000)
    }) 
  })
}) 
.catch(function(err) {
  console.error('Error while initializing explorer') 
  console.error(err.stack)
})
