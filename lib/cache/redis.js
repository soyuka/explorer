"use strict";
var redis = require('redis')
var Promise = require('bluebird')

Promise.promisifyAll(redis.RedisClient.prototype)

function RedisCache(config) {
  var client = redis.createClient(config.redis.host, {})
    //register event to avoid an exception
    .on('error', function(err) {
      console.error(err.stack)      
    })

  var timeset = 'explorer:mtime'
  var sizeset = 'explorer:size'

  return {
    getTime: (hash) => client.hgetAsync(timeset, hash).then(parseInt),
    setTime: (hash, time) => client.hsetAsync(timeset, hash, time),
    getSize: (hash) => client.hgetAsync(sizeset, hash).then(parseInt),
    setSize: (hash, size) => client.hsetAsync(sizeset, hash, size)
  }
}

module.exports = RedisCache
