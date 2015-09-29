"use strict";
var Promise = require('bluebird')
var memory = require('memory-cache')
var Cache = require('./cache.js')
var util = require('util')

/**
 * MemoryCache 
 * in-memory storage
 * @param string namespace
 */
function MemoryCache(namespace) {
  if(!(this instanceof MemoryCache)) {
    return new MemoryCache(namespace) 
  }

  Cache.apply(this, arguments)
}

util.inherits(MemoryCache, Cache)

/**
 * Check and throw if check doesn't pass
 * @throws TypeError
 * @return boolean true
 */
MemoryCache.prototype.checkOrThrow = function() {
  let check = this.check.apply(this, arguments)

  if(check instanceof TypeError)
    throw check

  return check
}

/**
 * @inheritdoc
 */
MemoryCache.prototype.get = function(key) {
  var self = this

  return new Promise(function(resolve, reject) {
    self.checkOrThrow(key)

    return resolve(memory.get(self.toKey(key)))
  })
}

/**
 * @inheritdoc
 */
MemoryCache.prototype.put = function(key, value, ttl) {
  var self = this

  return new Promise(function(resolve, reject) {
    self.checkOrThrow(key, value)

    return resolve(memory.put(self.toKey(key), value, ttl))
  })
}

/**
 * @inheritdoc
 */
MemoryCache.prototype.remove = function(key) {
  var self = this

  return new Promise(function(resolve, reject) {
    self.checkOrThrow(key)
    
    return resolve(memory.del(self.toKey(key)))
  })
}

module.exports = MemoryCache
