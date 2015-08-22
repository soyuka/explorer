'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _memoryJs = require('./memory.js');

var _memoryJs2 = _interopRequireDefault(_memoryJs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function Stat(namespace) {
  if (!this instanceof Stat) {
    return new Stat(namespace);
  }

  if (!namespace) {
    throw new TypeError('Stat needs a namespace, none given');
  }

  this.memory = new _memoryJs2['default'](namespace);
}

Stat.prototype.add = function (user, data) {
  var s = this.memory.get(user);

  if (!s) {
    s = [];
  }

  if (_util2['default'].isArray(data)) {
    for (var i in data) {
      if (!('time' in data[i])) {
        data[i].time = new Date();
      }
    }

    s = s.concat(data);
  } else {
    if (!('time' in data)) {
      data.time = new Date();
    }

    s.push(data);
  }

  this.memory.put(user, s);

  return this;
};

Stat.prototype.remove = function (user) {
  if (!user) {
    throw new TypeError('Removing a whole memory instance through stat is not possible');
  }

  return this.memory.remove(user);
};

Stat.prototype.get = function () {
  var user = arguments[0] === undefined ? null : arguments[0];

  return this.memory.get(user);
};

exports['default'] = Stat;
module.exports = exports['default'];