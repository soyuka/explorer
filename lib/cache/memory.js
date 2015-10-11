'use strict';
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
 * @inheritdoc
 */
MemoryCache.prototype.get = function(key) {
  var self = this

  return new Promise(function(resolve, reject) {
    let check = self.check(key)
    if(check !== true) 
      return reject(check)

    return resolve(memory.get(self.toKey(key)))
  })
}

/**
 * @inheritdoc
 */
MemoryCache.prototype.put = function(key, value, ttl) {
  var self = this

  if(ttl)
    ttl = ttl * 1000

  return new Promise(function(resolve, reject) {
    let check = self.check(key, value)
    if(check !== true) 
      return reject(check)

    return resolve(memory.put(self.toKey(key), value, ttl))
  })
}

/**
 * @inheritdoc
 */
MemoryCache.prototype.remove = function(key) {
  var self = this

  return new Promise(function(resolve, reject) {
    let check = self.check(key)
    if(check !== true) 
      return reject(check)
    
    return resolve(memory.del(self.toKey(key)))
  })
}

module.exports = MemoryCache
