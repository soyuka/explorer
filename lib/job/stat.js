import Memory from './memory.js'
import util from 'util'

function Stat(namespace) {
  if(!this instanceof Stat) { return new Stat(namespace) }

  if(!namespace) {
    throw new TypeError('Stat needs a namespace, none given') 
  }

  this.memory = new Memory(namespace)
}

Stat.prototype.add = function(user, data) {
  let s = this.memory.get(user)

  if(!s) {
    s = [] 
  }

  if(util.isArray(data))
    s = s.concat(data)
  else {
    if(!('time' in data)) {
      data.time = new Date() 
    }

    s.push(data)
  }

  this.memory.put(user, s)

  return this
}

Stat.prototype.remove = function(user) {
  if(!user) {
    throw new TypeError('Removing a whole memory instance through stat is not possible')
  }

  return this.memory.remove(user)
}

Stat.prototype.get = function(user = null) {
  return this.memory.get(user)
}

export default Stat
