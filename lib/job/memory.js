let stat = {}

function Memory(command) {
  if(!(this instanceof Memory)) {
    return new Memory(command) 
  }

  if(!stat[command]) {
   stat[command] = {}
  }

  this.storage = stat[command]

  return {
    get: k => k ? this.storage[k] : this.storage,
    add: (k, o) => this.storage[k] = o,
    remove: k => ~Object.keys(this.storage).indexOf(k) ? delete this.storage[k] : false
  }
}

export default Memory
