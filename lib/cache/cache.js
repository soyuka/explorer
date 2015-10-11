'use strict';

function Cache(namespace) {
  if(!namespace) {
    throw new TypeError('Cache needs a namespace, none given') 
  }
  
  if(!(this instanceof Cache)) {
    return new Cache(namespace) 
  }

  this.namespace = namespace
}

/**
 * Check that arguments are strings
 * @return mixed TypeError or true
 */
Cache.prototype.check = function() {
  var test = [].slice.call(arguments).every(function(e) {
    return typeof e == 'string' && e.length
  })

  if(test !== true) return 'Key/value arguments must be strings'

  return test
}

/**
 * Get the memory key
 * @param string key
 * @return string namespace:key
 */
Cache.prototype.toKey = function(key) {
  return this.namespace + ':' + key
}

/**
* get
* @param string key
* @return string
*/
Cache.prototype.get = function(key) {
}

/**
 * put
 * @param string key
 * @param string value
 * @param integer ttl miliseconds
 * @return void
 */
Cache.prototype.put = function(key, value, ttl) {
}

/**
 * remove
 * @param string key
 * @return boolean
 */
Cache.prototype.remove = function(key) {
}

module.exports = Cache
