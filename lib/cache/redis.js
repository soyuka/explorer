"use strict";
var redis = require('redis')
var Promise = require('bluebird')

Promise.promisifyAll(redis.RedisClient.prototype)

function returnInt(v) { return parseInt(v) }

function RedisCache(config) {
  var client = redis.createClient(config.redis.host, {})
    .on('error', function(err) {
      console.error(err.stack)      
    })

  var timeset = 'explorer:mtime'
  var sizeset = 'explorer:size'

  return {
    getTime: (hash) => client.hgetAsync(timeset, hash).then(returnInt),
    setTime: (hash, time) => client.hsetAsync(timeset, hash, time),
    getSize: (hash) => client.hgetAsync(sizeset, hash).then(returnInt),
    setSize: (hash, size) => client.hsetAsync(sizeset, hash, size)
  }
}

module.exports = RedisCache
