'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var stat = {};

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
    get: function get(k) {
      return k ? _this.storage[k] : _this.storage;
    },
    put: function put(k, o) {
      return _this.storage[k] = o;
    },
    remove: function remove(k) {
      return ~Object.keys(_this.storage).indexOf(k) ? delete _this.storage[k] : false;
    }
  };
}

exports['default'] = Memory;
module.exports = exports['default'];