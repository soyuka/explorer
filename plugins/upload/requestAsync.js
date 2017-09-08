'use strict';
var debug = require('debug')('explorer:job:upload')
var Promise = require('bluebird')
var utils = require('../../lib/utils.js')
var got = require('got')
var filenamify = require('filenamify')
var contentDisposition = require('content-disposition')
var prettyBytes = require('pretty-bytes')
var fs = require('fs')
var u = require('url')
var p = require('path')

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

    let stream = got.stream(url)
    let name = filenamify(decodeURI(p.basename(url)))
    let ext = p.extname(name)

    if(utils.existsSync(p.join(destination, name))) {
      name = p.basename(name, ext) + '-' + Date.now() + ext
    }

    let path = p.join(destination, name)

    stream.on('response', function(res) {
     stream.headers = res.headers 
    
     let cd = stream.headers['content-disposition']
     if(cd) {
        let n = contentDisposition.parse(cd)
        if(n.parameters.filename) {
          name = n.parameters.filename
          path = p.join(destination, name)
        }
     }

     debug('Response headers %o', stream.headers)
     debug('File %s => %s', name, path)
    })
    .on('error', function(error, body, res) {
     console.error(error); 
    })
    .pipe(fs.createWriteStream(path))
    .on('finish', function() {
      let size = 0
      if(stream.headers['content-size']) {
        size = stream.headers['content-size']
      }

      if(size > 0) {
        return resolve({
          path: destination,
          search: name,
          message: url + ' was uploaded successfully to '+path+' ('+prettyBytes(size)+')'
        })
      }

      debug('No size')

      fs.stat(path, function(err, fstat) {
        if(err) {
          return reject(err) 
        } 

        size = fstat.size
        return resolve({
          path: destination,
          search: name,
          message: url + ' was uploaded successfully to '+path+' (' + prettyBytes(size) + ')'
        })
      })
    })
  })
}

module.exports = requestAsync
