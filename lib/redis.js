'use strict';
var Redis = require('ioredis')
var Promise = require('bluebird')

module.exports = function(config) {
  let client = new Redis(config.redis)
  .on('error', function(err) {
    if(err.code == 'ECONNREFUSED') {
      client.disconnect() 
      return;
    }

    if(config.dev)
      console.error(err.stack) 
    else
      console.error(err.message)
  })

  return client
}
