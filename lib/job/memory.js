'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var stat = {};

/**
 * Memory 
 * in-memory storage
 * @param string namespace
 */
function Memory(namespace) {
  var _this = this;

  if (!(this instanceof Memory)) {
    return new Memory(namespace);
  }

  if (!namespace) {
    throw new TypeError('Memory needs a namespace, none given');
  }

  if (!stat[namespace]) {
    stat[namespace] = {};
  }

  this.storage = stat[namespace];

  return {
    /**
     * get
     * @param string [key]
     * @return mixed
     */
    get: function get(k) {
      return k ? _this.storage[k] : _this.storage;
    },
    /**
     * put
     * @param string k
     * @param mixed o
     * @return void
     */
    put: function put(k, o) {
      return _this.storage[k] = o;
    },
    /**
     * remove
     * @param string k key
     * @return boolean Delete successfully or not
     */
    remove: function remove(k) {
      return ~Object.keys(_this.storage).indexOf(k) ? delete _this.storage[k] : false;
    }
  };
}

exports['default'] = Memory;
module.exports = exports['default'];