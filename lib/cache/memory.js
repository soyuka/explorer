import memory from '../job/memory.js'
import Promise from 'bluebird'

let timemem = memory('explorer:mtime')
let sizemem = memory('explorer:size')

module.exports = function(config) {
  return {
    getTime: (hash) => Promise.resolve(timemem.get(hash)),
    setTime: (hash, time) => Promise.resolve(timemem.put(hash, time)),
    getSize: (hash) => Promise.resolve(sizemem.get(hash)),
    setSize: (hash, size) => Promise.resolve(sizemem.put(hash, size))
  }
}
