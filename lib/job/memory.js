let stat = {}

function Memory(namespace) {
  if(!(this instanceof Memory)) {
    return new Memory(namespace) 
  }

  if(!stat[namespace]) {
   stat[namespace] = {}
  }

  this.storage = stat[namespace]

  return {
    get: k => k ? this.storage[k] : this.storage,
    put: (k, o) => this.storage[k] = o,
    remove: k => ~Object.keys(this.storage).indexOf(k) ? delete this.storage[k] : false
  }
}

export default Memory
