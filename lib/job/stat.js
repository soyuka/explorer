"use strict";
var Memory = require('./memory.js')
var util = require('util')

/**
 * Stat
 * @see Memory
 * Stores data per users in a memory namespace
 */
function Stat(namespace) {
  if(!this instanceof Stat) { return new Stat(namespace) }

  if(!namespace) {
    throw new TypeError('Stat needs a namespace, none given') 
  }

  this.memory = new Memory(namespace)
}

/**
 * Add
 * Adds data to a user, add time if none provided
 * @param string username
 * @param mixed data
 * @return this
 */
Stat.prototype.add = function(user, data) {
  var s = this.memory.get(user)

  if(!s) {
    s = [] 
  }

  if(util.isArray(data)) {
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

  this.memory.put(user, s)

  return this
}

/**
 * Remove
 * Removes a memory namespace
 * @param string username
 * @return boolean
 */
Stat.prototype.remove = function(user) {
  if(!user) {
    throw new TypeError('Removing a whole memory instance through stat is not possible')
  }

  return this.memory.remove(user)
}

/**
 * Get
 * Get a memory namespace
 * @param mixed username
 * @return mixed
 */
Stat.prototype.get = function(user) {
  if(!user) { user = null }

  return this.memory.get(user)
}

module.exports = Stat
