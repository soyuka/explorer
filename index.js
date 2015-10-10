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
  http.createServer(app).listen(config.port, e => !config.quiet ? console.log('HTTP listening on %s', config.port) : 1)

  if(config.https.enabled) {
    https.createServer(https_options, app).listen(config.https.port, e => !config.quiet ? console.log('HTTPS listening on %s', config.https.port) : 1)
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

}) 
.catch(function(err) {
  console.error('Error while initializing explorer') 
  console.error(err.stack)
})
