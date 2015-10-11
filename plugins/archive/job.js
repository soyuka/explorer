'use strict';
var archiver = require('archiver')
var http = require('http')
var fs = require('fs')
var p = require('path')
var prettyBytes = require('pretty-bytes')

var debug = require('debug')('explorer:job:archive')

function ArchiveJob(ipc) {
  if(!ipc)
    ipc = null

  if(!(this instanceof ArchiveJob)) { return new ArchiveJob(ipc) }
  this.ipc = ipc
}

/**
 * Creates an archive
 * data : {
 *   name, temp, directories, paths, root, stream (string|http.ServerResponse), options (req.options)
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
    self.ipc.send('archive:notify', user.username, {
      message: 'Compressing data from '+data.root+' to '+data.temp
    })
  }

  archive.pipe(data.stream)

  for(let i in data.paths) {
    archive.append(fs.createReadStream(data.paths[i]), {name: p.basename(data.paths[i])}) 
  }

  for(let i in data.directories) {
    archive.directory(data.directories[i], data.directories[i].replace(data.root, ''))
  }

  archive.finalize()
}

module.exports = ArchiveJob
