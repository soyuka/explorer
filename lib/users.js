'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var debug = require('debug')('explorer:users');
var Promise = require('bluebird');
var util = require('util');
var fs = Promise.promisifyAll(require('fs'));
var p = require('path');
var eol = require('os').EOL;
var bcrypt = Promise.promisifyAll(require('bcrypt'));

var saltLength = 9;
var keyLength = 25;

/**
 * Database handler
 */

var Users = (function () {
  function Users(options) {
    _classCallCheck(this, Users);

    options = options || {};

    this.database = options.database || p.resolve(__dirname, '../data/users');
  }

  _createClass(Users, [{
    key: 'load',

    /**
     * Load database from file
     * @return Promise
     */
    value: function load() {
      var self = this;

      return this.parse().then(function (users) {
        debug('DB Loaded, %o', users);
        self.users = users;
      })['catch'](function (e) {
        console.error('Can not load database');
      });
    }
  }, {
    key: 'remove',

    /**
     * Remove a user from the file
     * @param string username
     * @return Promise
     */
    value: function remove(username) {
      var u = this.users.findIndex(function (u) {
        return u.username == username;
      });

      if (! ~u) {
        return Promise.reject('User ' + username + ' not found');
      }

      this.users.splice(u, 1);

      return this.write();
    }
  }, {
    key: 'put',

    /**
     * Put a user to the file
     * @param string username
     * @callback
     */
    value: function put(user) {
      if (!(user instanceof User)) throw new TypeError('Not a User instance');

      var u = this.users.findIndex(function (e) {
        return e.username == user.username;
      });

      if (~u) {
        debug('update user %s, %s', user.username, user);
        this.users[u] = user;
      } else {
        debug('new user %s', user);
        this.users.push(user);
      }

      return this.write();
    }
  }, {
    key: 'write',
    value: function write() {
      var str = [];

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.users[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var i = _step.value;

          i && str.push(i.toString());
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return fs.writeFileAsync(this.database, str.join(eol));
    }
  }, {
    key: 'parse',
    value: function parse() {
      return fs.readFileAsync(this.database, { encoding: 'utf-8' }).then(function (db) {

        db = db.split(eol);

        if (db[db.length - 1] === '') db.pop();

        var promises = db.map(function (e) {
          return e.split(':');
        }).map(function (e) {
          return new User({
            username: e[0],
            password: e[1],
            home: e[2],
            key: e[3],
            admin: e[4] === '1' ? true : false
          }, false);
        });

        return Promise.all(promises);
      });
    }
  }, {
    key: 'get',
    value: function get(username) {
      return this.users.find(function (u) {
        return u.username == username;
      });
    }
  }, {
    key: 'delete',
    value: function _delete(username) {
      var u = this.users.findIndex(function (e) {
        return e.username == username;
      });

      if (! ~u) {
        return Promise.reject('User ' + username + ' does not exist');
      }

      this.users.splice(u, 1);

      return this.write();
    }
  }, {
    key: 'getByKey',
    value: function getByKey(key) {
      return this.users.find(function (u) {
        return u.key == key;
      });
    }
  }, {
    key: 'authenticate',
    value: function authenticate(username, password) {
      var u = this.get(username);

      if (!u) return Promise.reject('No user with the username ' + username);

      return bcrypt.compareAsync(password, u.password).then(function (ok) {
        return Promise.resolve(ok);
      })['catch'](function (err) {
        console.error(err);
        return Promise.reject('wrong password');
      });
    }
  }]);

  return Users;
})();

var User = (function () {
  function User(user) {
    var crypt = arguments[1] === undefined ? true : arguments[1];

    _classCallCheck(this, User);

    this.properties = ['username', 'password', 'home', 'key', 'admin'];

    user.admin = user.admin === true || user.admin === 1 ? 1 : 0;

    if (!this.isValid(user)) {
      throw new TypeError('User is not valid');
    }

    util._extend(this, user);

    if (!crypt) return Promise.resolve(this);

    return this.crypt();
  }

  _createClass(User, [{
    key: 'isValid',
    value: function isValid(user) {
      var valid = this.properties.filter(function (e) {
        return !user.hasOwnProperty(e) || /:/g.test(user[e]);
      });

      return valid.length == 0;
    }
  }, {
    key: 'crypt',
    value: function crypt() {
      var self = this;
      return bcrypt.hashAsync(this.password, saltLength).then(function (hash) {
        self.password = hash;
        return Promise.resolve(self);
      })['catch'](function (err) {
        console.error(err);
        return Promise.reject('Could not hash password');
      });
    }
  }, {
    key: 'generateKey',
    value: function generateKey() {
      var self = this;

      return bcrypt.genSaltAsync(saltLength).then(function (salt) {
        return bcrypt.hashAsync(salt, saltLength);
      }).then(function (hash) {
        var l = hash.length;
        var s = [];
        var i = 0;
        while (l-- && i < keyLength) {
          var c = hash.charAt(l);
          if (/[a-z0-9]/i.test(c)) {
            s.push(c);
            i++;
          }
        }

        self.key = s.join('');
        return Promise.resolve(self);
      })['catch'](function (err) {
        console.error(err);
        return Promise.reject('Could not generate key');
      });
    }
  }, {
    key: 'toString',
    value: function toString() {
      var str = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.properties[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _p = _step2.value;

          str.push('' + this[_p]);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return str.join(':');
    }
  }]);

  return User;
})();

exports.User = User;
exports.Users = Users;