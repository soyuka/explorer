'use strict';

/**
 * Notify
 * Stores notification data per users in a cache namespace
 */
function Notify(namespace, cache) {
  if(!this instanceof Notify) { return new Notify(namespace, cache) }

  if(!namespace) {
    throw new TypeError('Notify needs a namespace, none given') 
  }

  this.memory = cache(namespace)
}

/**
 * Add
 * Adds data to a user, add time if none provided
 * @param string username
 * @param mixed data
 * @return Promise
 */
Notify.prototype.add = function(user, data) {
  var self = this

  return this.get(user)
  .then(function(s) {
    if(!s) {
      s = [] 
    }
  
    if(Array.isArray(data)) {
      for(let i in data) {
        if(!('time' in data[i])) {
          data[i].time = new Date() 
        }
      }

      s = s.concat(data)
    } else {
      if(!('time' in data)) {
        data.time = new Date() 
      }

      s.push(data)
    }

    return self.memory.put(user, JSON.stringify(s))
  })
}

/**
 * Remove
 * Removes a memory namespace
 * @param string username
 * @return Promise
 */
Notify.prototype.remove = function(user) {
  if(!user) {
    return Promise.reject(new ReferenceError('Removing a whole memory instance through stat is not possible'))
  }

  return this.memory.remove(user)
}

/**
 * Get
 * Get a memory namespace
 * @param mixed username
 * @return 
 */
Notify.prototype.get = function(user) {
  if(!user) { 
    return Promise.reject(new ReferenceError('Accessing a whole memory instance through stat is not possible'))
  }

  return this.memory.get(user)
  .then(JSON.parse)
}

module.exports = Notify
