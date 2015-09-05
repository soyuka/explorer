let stat = {}

/**
 * Memory 
 * in-memory storage
 * @param string namespace
 */
function Memory(namespace) {
  if(!(this instanceof Memory)) {
    return new Memory(namespace) 
  }

  if(!namespace) {
    throw new TypeError('Memory needs a namespace, none given') 
  }

  if(!stat[namespace]) {
   stat[namespace] = {}
  }

  this.storage = stat[namespace]

  return {
    /**
     * get
     * @param string [key]
     * @return mixed
     */
    get: k => k ? this.storage[k] : this.storage,
    /**
     * put
     * @param string k
     * @param mixed o
     * @return void
     */
    put: (k, o) => this.storage[k] = o,
    /**
     * remove
     * @param string k key
     * @return boolean Delete successfully or not
     */
    remove: k => ~Object.keys(this.storage).indexOf(k) ? delete this.storage[k] : false
  }
}

export default Memory
