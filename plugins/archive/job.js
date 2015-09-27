"use strict";
var archiver = require('archiver')
var http = require('http')
var fs = require('fs')
var p = require('path')
var prettyBytes = require('pretty-bytes')

var debug = require('debug')('explorer:job:archive')

function ArchiveJob(ipc, stat) {
  if(!ipc)
    ipc = null

  if(!(this instanceof ArchiveJob)) { return new ArchiveJob(ipc, stat) }
  this.ipc = ipc
  this.stat = stat
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
      self.ipc.send('error', err.stack)
      return self.stat.add(user.username, {error: err.message})
    } else {
      return data.stream.status(500).send(err);
    }
  })

  //on stream closed we can end the request
  archive.on('end', function() {
    var b = archive.pointer()

    debug('Archive wrote %d bytes', b)

    if(!(data.stream instanceof http.ServerResponse)) {
      self.ipc.send('archive.create', user.username, data)
      return self.stat.add(user.username, {message: prettyBytes(b) + ' written in '+data.temp, path: p.dirname(data.temp), name: data.name})
    }
  })

  if(data.stream instanceof http.ServerResponse) {
    //set the archive name
    data.stream.attachment(data.name + '.zip')
  } else if(typeof data.stream == 'string') {

    data.stream = fs.createWriteStream(data.stream) 
    self.stat.add(user.username, {message: 'Compressing data from '+data.root+' to '+data.temp, name: data.name})
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

ArchiveJob.prototype.info = function() {
  return this.stat.get()
}

ArchiveJob.prototype.clear = function(user) {
  return this.stat.remove(user)
}

module.exports = ArchiveJob
