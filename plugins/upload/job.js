'use strict';
var Promise = require('bluebird')
var requestAsync = require('./requestAsync.js')

/**
 * UploadJob plugin
 * @param IPCEE ipc
 */
function UploadJob() {
  if(!(this instanceof UploadJob)) { return new UploadJob() }
}

/**
 * Creates remote uploads
 * @param array urls
 * @param Object user
 * @param Object config
 */
UploadJob.prototype.create = function(urls, user, config) {
  var self = this

  return Promise.map(urls, function(e) {
    return requestAsync(e, config.upload.path)
  }, {concurrency: config.concurrency || 10})
  .then(function(data) {
    self.ipc.send('upload:notify', user.username, data)
  })
  .catch(function(err) {
    console.error(err.message) 
    console.error(err.stack) 
    self.ipc.send('upload:notify', user.username, {message: err.message, error: true})
  })
}

UploadJob.prototype.setChannel = function(channel) {
  this.ipc = channel
}

module.exports = UploadJob
