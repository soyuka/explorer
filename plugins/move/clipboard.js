'use strict';
function Clipboard(memory) {
  if(!(this instanceof Clipboard))
    return new Clipboard(memory)

  this.memory = memory
}

Clipboard.prototype.update = function(sources, method, username) {
  return this.memory.get(username)
  .then(clipboard => {
    clipboard = clipboard.filter(e => {
      let exists = sources.directories.find(e => ({
        path: e.path, directory: true, method: method
      }))

      if(exists)
        return false

      exists = sources.files.find(e => ({
        path: e.path, directory: true, method: method
      }))

      if(exists)
        return false

      return true
    }) 

    return this.memory.remove(username)
    .then(() => {
      return this.memory.add(username, clipboard)
    })
  })
}

Clipboard.prototype.toSources = function(data, method) {
  data = data.filter(e => e.method == method)

  return {
    files: data.map(f => f.directory === true ? null : f.path)
          .filter(f => f !== null),
    directories:  data.map(f => f.directory === false ? null : f.path)
          .filter(f => f !== null)
  }
}

Clipboard.prototype.parseFormData = function(data, username) {
  if(!Array.isArray(data))
    data = [data]
   
  //get items method/path
  let items = data.map(function(e) {
    let isCopy = /^copy\-/.test(e)
    let isCut = /^cut\-/.test(e)

    if(!isCut && !isCopy)
      return null

    let word = isCopy ? 'copy' : 'cut'

    return {
      method: word, 
      path: e.replace(word+'-', '')
    } 
  }).filter(e => e != null)

  return this.memory.get(username)
  .then(function(clipboard) {
    //get items that are in the clipboard
    clipboard = clipboard.filter(e => {
      return items.find(f => e.path == f.path && e.method == f.method)
    })

    return clipboard
  })
}

Clipboard.prototype.parseActionData = function(data, method) {
  return [].concat.apply(data.files.map(f => ({
    method: method,
    path: f,
    directory: false
  })), data.directories.map(f => ({
    method: method,
    path: f,
    directory: true
  })))
}


module.exports = Clipboard
