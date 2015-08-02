import archiver from 'archiver'
import http from 'http'
import fs from 'fs'
import p from 'path'
import prettyBytes from 'pretty-bytes'
import memory from '../job/memory.js'

let debug = require('debug')('explorer:job:archive')
let stat = memory('archive')

function Archive(ipc = null) {
  if(!(this instanceof Archive)) { return new Archive(ipc) }
  this.ipc = ipc
}

Archive.prototype.create = function(data) {
  let archive = archiver('zip') 
  let self = this

  archive.on('error', function(err) {
    archive.abort()
    if(!(data.stream instanceof http.ServerResponse)) {
      return self.ipc.send('error', err.stack)
    } else {
      return data.stream.status(500).send(err);
    }
  })

  //on stream closed we can end the request
  archive.on('end', function() {
    let b = archive.pointer()

    debug('Archive wrote %d bytes', b)

    if(!(data.stream instanceof http.ServerResponse)) {
      stat.remove(data.stream)
      return self.ipc.send('info', `${prettyBytes(b)} written in ${data.temp}`)
    }
  })

  if(data.stream instanceof http.ServerResponse) {
    //set the archive name
    data.stream.attachment(`${data.name}.zip`)
  } else if(typeof data.stream == 'string') {
    stat.add(data.stream, {name: data.name, paths: data.paths, directories: data.directories, root: data.root})
    data.stream = fs.createWriteStream(data.stream) 
  }

  archive.pipe(data.stream)

  for(let i in data.paths) {
    archive.append(fs.createReadStream(data.paths[i]), {name: p.basename(data.paths[i])}) 
  }

  for(let i in data.directories) {
    archive.directory(data.directories[i], data.directories[i].replace(data.options.root, ''))
  }

  archive.finalize()
}

Archive.prototype.info = function() {
  return stat.get()
}

export default Archive
