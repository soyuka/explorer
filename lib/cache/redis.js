import redis from 'redis'
import Promise from 'bluebird'

Promise.promisifyAll(redis.RedisClient.prototype)

function returnInt(v) { return parseInt(v) }

module.exports = function(config) {
  let client = redis.createClient(config.redis.host, {})
    .on('error', function(err) {
      console.error(err.stack)      
    })

  let timeset = 'explorer:mtime'
  let sizeset = 'explorer:size'

  return {
    getTime: (hash) => client.hgetAsync(timeset, hash).then(returnInt),
    setTime: (hash, time) => client.hsetAsync(timeset, hash, time),
    getSize: (hash) => client.hgetAsync(sizeset, hash).then(returnInt),
    setSize: (hash, size) => client.hsetAsync(sizeset, hash, size)
  }
}
