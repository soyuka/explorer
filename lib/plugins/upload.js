import Download from 'download'
import u from 'url'
import p from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import Stat from '../job/stat.js'
import prettyBytes from 'pretty-bytes'
import isNumber from 'is-number'

let stat = new Stat('upload')
let download = new Download()
let debug = require('debug')('explorer:job:upload')

/**
 * Requests the url, downloads to dest and stat notifications
 * @param string url
 * @param string destination
 * @return Promise
 */
function requestAsync(url, destination) {
  let size = 0
  let filename

  return new Promise(function(resolve, reject) {
    debug('Requesting', url)

    let d = require('download')

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
      let file = files[0]

      if(!file.basename)
        file.basename = filename
    
      //this is an upload error and is not considered as a system error
      if(err) {
        console.error(err.message)
        return resolve({error: 'Upload of ' + url + ' failed: ' + err.message}) 
      }

      size = file.stat.size

      if(file.isBuffer() && size <= 0) {
        size = file.contents.length
      }

      if(size > 0) {
        return resolve({path: destination, name: file.basename, message: `${url} was uploaded successfully to ${file.path} (${prettyBytes(size)})`})
      }

      debug('No size')

      fs.stat(file.path, function(err, stat) {
        if(err) {
          return reject(err) 
        } 

        size = stat.size
        return resolve({path: destination, name: file.basename, message: `${url} was uploaded successfully to ${file.path} (${prettyBytes(size)})`})

      })
    })
  })
}

/**
 * Upload plugin
 * @param IPCEE ipc
 */
function Upload(ipc) {
  if(!(this instanceof Upload)) { return new Upload(ipc) }
  this.ipc = ipc
}

/**
 * Creates remote uploads
 * @param array urls
 * @param Object user
 * @param Object config
 */
Upload.prototype.create = function(urls, user, config) {
  var self = this

  return Promise.map(urls, function(e) {
    return requestAsync(e, config.upload.path)
  }, {concurrency: config.concurrency || 10})
  .then(function(data) {
    self.ipc.send('upload.create', user.username, data)
    return stat.add(user.username, data)
  })
  .catch(function(err) {
    console.error(err.message) 
    console.error(err.stack) 
    self.ipc.send('upload.error', user.username, err.stack)
    return stat.add(user.username, {error: err.message})
  })
}

/**
 * Upload stat info
 * @return Stat
 */
Upload.prototype.info = function() {
  return stat.get()
}

Upload.prototype.clear = function(user) {
  return stat.remove(user)
}

export default Upload
