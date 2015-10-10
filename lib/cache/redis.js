"use strict";
var Promise = require('bluebird')
var Cache = require('./cache.js')
var util = require('util')

/**
 * RedisCache 
 * in-memory storage
 * @param string namespace
 */
function RedisCache(namespace, client) {
  if(!(this instanceof RedisCache)) {
    return new RedisCache(namespace, client) 
  }

  Cache.apply(this, arguments)

  if(!(client.constructor.name == 'Redis')) {
    throw new TypeError("Client should be a Redis instance") 
  }

  this.client = client
}

util.inherits(RedisCache, Cache)

/**
 * @inheritdoc
 */
RedisCache.prototype.get = function(key) {
  let check = this.check(key)
  if(check !== true)
    return Promise.reject(check)

  return this.client.get(this.toKey(key))
}

/**
 * @inheritdoc
 */
RedisCache.prototype.put = function(key, value, ttl) {
  let check = this.check(key, value)
  if(check !== true)
    return Promise.reject(check)

  let self = this
  key = this.toKey(key)

  return this.client.set(key, value)
  .then(function() {
    if(util.isNumber(ttl)) {
      return self.client.expire(key, ttl)
    }

    return Promise.resolve()
  })
}

/**
 * @inheritdoc
 */
RedisCache.prototype.remove = function(key) {
  let check = this.check(key)
  if(check !== true)
    return Promise.reject(check)

  return this.client.del(this.toKey(key))
  .then(function(i) {
    return !!i
  })
}

module.exports = RedisCache
