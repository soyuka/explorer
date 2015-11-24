'use strict';
var archiver = require('archiver')
var http = require('http')
var fs = require('fs')
var p = require('path')
var prettyBytes = require('pretty-bytes')

var debug = require('debug')('explorer:job:archive')

function ArchiveJob() {
  if(!(this instanceof ArchiveJob)) { return new ArchiveJob() }
}

/**
 * Creates an archive
 * data : {
 *   name, temp, directories, paths, stream (string|http.ServerResponse), options (req.options)
 * }
 */
ArchiveJob.prototype.create = function(data, user, config) {
  var archive = archiver('zip') 
  var self = this

  archive.on('error', function(err) {
    archive.abort()
    if(!(data.stream instanceof http.ServerResponse)) {
      return self.ipc.send('archive:notify', user.username, {message: err.message, error: true})
    } else {
      return data.stream.status(500).send(err);
    }
  })

  //on stream closed we can end the request
  archive.on('end', function() {
    let b = archive.pointer()

    debug('Archive wrote %d bytes', b)

    if(!(data.stream instanceof http.ServerResponse)) {
      return self.ipc.send('archive:notify', user.username, {
        message: prettyBytes(b) + ' written in '+data.temp,
        path: p.dirname(data.temp), 
        search: data.name + '.zip'
      })
    }
  })

  if(data.stream instanceof http.ServerResponse) {
    //set the archive name
    data.stream.attachment(data.name + '.zip')
  } else if(typeof data.stream == 'string') {

    data.stream = fs.createWriteStream(data.stream) 
  }

  archive.pipe(data.stream)

  for(let i in data.directories) {
    archive.directory(data.directories[i], p.basename(data.directories[i]))
  }

  for(let i in data.files) {
    archive.append(fs.createReadStream(data.files[i]), {name: p.basename(data.files[i])}) 
  }

  archive.finalize()
}

ArchiveJob.prototype.setChannel = function(channel) {
  this.ipc = channel
}

module.exports = ArchiveJob
