var Redis = require('ioredis')
var Promise = require('bluebird')

module.exports = function(config) {
  return new Redis(config.redis)
  .on('error', function(err) {
    if(config.dev)
      console.error(err.stack) 
    else
      console.error(err.message)
  })
}
