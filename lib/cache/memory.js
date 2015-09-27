"use strict";
var memory = require('../job/memory.js')
var Promise = require('bluebird')

var timemem = memory('explorer:mtime')
var sizemem = memory('explorer:size')

function MemoryCache(config) {
  return {
    getTime: (hash) => Promise.resolve(timemem.get(hash)),
    setTime: (hash, time) => Promise.resolve(timemem.put(hash, time)),
    getSize: (hash) => Promise.resolve(sizemem.get(hash)),
    setSize: (hash, size) => Promise.resolve(sizemem.put(hash, size))
  }
}

module.exports = MemoryCache
