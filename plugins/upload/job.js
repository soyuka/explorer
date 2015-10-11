'use strict';
var Download = require('download')
var u = require('url')
var p = require('path')
var fs = require('fs')
var Promise = require('bluebird')
var prettyBytes = require('pretty-bytes')

var download = new Download()
var debug = require('debug')('explorer:job:upload')

/**
 * Requests the url, downloads to dest and notifications
 * @param string url
 * @param string destination
 * @return Promise
 */
function requestAsync(url, destination) {
  var size = 0
  var filename

  return new Promise(function(resolve, reject) {
    debug('Requesting', url)

    var d = require('download')

    new Download()
    .get(url)
    .dest(destination)
    .rename(function(file) {
      filename = file.basename + file.extname

      //rename if exists
      if(fs.existsSync(p.join(destination, filename))) {
        file.basename += '-' + Date.now() 
        filename = file.basename + file.extname
      }
    })
    .run(function(err, files) {

      //this is an upload error and is not considered as a system error
      if(err || !files) {
        console.error(err.message)
        return resolve({error: 'Upload of ' + url + ' failed: ' + err.message}) 
      }

      var file = files[0]

      if(!file.basename)
        file.basename = filename
    
      size = file.stat.size

      if(file.isBuffer() && size <= 0) {
        size = file.contents.length
      }

      if(size > 0) {
        return resolve({path: destination, search: file.basename, message: url + ' was uploaded successfully to '+file.path+' ('+prettyBytes(size)+')'})
      }

      debug('No size')

      fs.stat(file.path, function(err, fstat) {
        if(err) {
          return reject(err) 
        } 

        size = fstat.size
        return resolve({path: destination, search: file.basename, message: url + ' was uploaded successfully to '+file.path+' (' + prettyBytes(size) + ')'})

      })
    })
  })
}

/**
 * UploadJob plugin
 * @param IPCEE ipc
 */
function UploadJob(ipc) {
  if(!ipc) { ipc = null }

  if(!(this instanceof UploadJob)) { return new UploadJob(ipc) }
  this.ipc = ipc
}

/**
 * Creates remote uploads
 * @param array urls
 * @param Object user
 * @param Object config
 */
UploadJob.prototype.create = function(urls, user, config) {
  var self = this

  this.ipc.send('upload:notify', user.username, {message: 'Downloading '+urls.join(', ')+' to ' + config.upload.path})

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

module.exports = UploadJob
