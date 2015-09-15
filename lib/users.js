'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _userSchemaJs = require('./userSchema.js');

var _userSchemaJs2 = _interopRequireDefault(_userSchemaJs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var debug = require('debug')('explorer:users');
var fs = _bluebird2['default'].promisifyAll(require('fs'));
var bcrypt = _bluebird2['default'].promisifyAll(require('bcrypt'));

var saltLength = 9;
var keyLength = 25;

/**
 * Database handler
 */

var Users = (function () {

  /**
   * @constructor
   * @param object options (database path)
   * @return void
   */

  function Users(options) {
    _classCallCheck(this, Users);

    options = options || {};

    this.database = options.database || _path2['default'].resolve(__dirname, '../data/users');
  }

  /**
   * User class
   */

  /**
   * Load database from file
   * @return Promise
   */

  _createClass(Users, [{
    key: 'load',
    value: function load() {
      var self = this;

      return this.parse().then(function (users) {
        debug('DB Loaded, %o', users);
        self.users = users;
        return _bluebird2['default'].resolve();
      })['catch'](function (e) {
        console.error('Can not load database');
        return _bluebird2['default'].reject(e);
      });
    }

    /**
     * Remove a user from the file
     * @param string username
     * @return Promise
     */
  }, {
    key: 'remove',
    value: function remove(username) {
      var u = this.users.findIndex(function (u) {
        return u.username == username;
      });

      if (! ~u) {
        return _bluebird2['default'].reject('User ' + username + ' not found');
      }

      this.users.splice(u, 1);

      return this.write();
    }

    /**
     * Put a user to the file
     * @param string username
     * @return Promise
     */
  }, {
    key: 'put',
    value: function put(user) {
      if (!(user instanceof User)) throw new TypeError('Not a User instance');

      var u = this.users.findIndex(function (e) {
        return e.username == user.username;
      });

      if (~u) {
        debug('update user %s, %s', user.username, user);
        this.users[u] = user;
      } else {
        debug('user created %s', user);
        this.users.push(user);
      }

      return this.write();
    }

    /**
     * Writes the database
     * @return Promise
     */
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

      return fs.writeFileAsync(this.database, str.join(_os.EOL));
    }

    /**
     * Parse the database
     * @return Promise
     */
  }, {
    key: 'parse',
    value: function parse() {
      return fs.readFileAsync(this.database, { encoding: 'utf-8' }).then(function (db) {

        db = db.split(_os.EOL).filter(function (v) {
          return v.length > 0;
        });

        var promises = db.map(function (e) {
          return e.split(':');
        }).map(function (e) {
          var u = {};
          for (var i in _userSchemaJs2['default']) {
            u[i] = e[_userSchemaJs2['default'][i].position];

            if (u[i] === undefined) u[i] = _userSchemaJs2['default'][i]['default'];

            if (_userSchemaJs2['default'][i].type == 'boolean') {
              u[i] = u[i] === '1' ? true : false;
            } else if (_userSchemaJs2['default'][i].type == 'buffer') {
              u[i] = new Buffer(u[i], 'base64').toString('ascii');
            }
          }

          return new User(u, false);
        });

        return _bluebird2['default'].all(promises);
      });
    }

    /**
     * Gets a User by username
     * @param string username
     * @return User
     */
  }, {
    key: 'get',
    value: function get(username) {
      return this.users.find(function (u) {
        return u.username == username;
      });
    }

    /**
     * Gets a User by key
     * @return User
     */
  }, {
    key: 'getByKey',
    value: function getByKey(key) {
      return this.users.find(function (u) {
        return u.key == key;
      });
    }

    /**
     * Deletes a user by username
     * @param string username
     * @return Promise
     */
  }, {
    key: 'delete',
    value: function _delete(username) {
      var u = this.users.findIndex(function (e) {
        return e.username == username;
      });

      if (! ~u) {
        return _bluebird2['default'].reject('User ' + username + ' does not exist');
      }

      this.users.splice(u, 1);

      return this.write();
    }

    /**
     * Authenticates a user
     * @param string username
     * @param string password
     * @return Promise
     */
  }, {
    key: 'authenticate',
    value: function authenticate(username, password) {
      var u = this.get(username);

      if (!u) {
        debug('User not found');
        return _bluebird2['default'].reject('No user with the username ' + username);
      }

      return bcrypt.compareAsync(password, u.password).then(function (ok) {
        return _bluebird2['default'].resolve(ok);
      })['catch'](function (err) {
        console.error(err);
        return _bluebird2['default'].reject('Wrong password');
      });
    }
  }]);

  return Users;
})();

var User = (function () {

  /**
   * @constructor
   * @param string user
   * @param boolean crypt wheter to encrypt password or not
   * @return Promise
   */

  function User(user) {
    var crypt = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    _classCallCheck(this, User);

    user = this.sanitize(user);

    debug('New User %o', user);

    if (!this.isValid(user)) {
      throw new TypeError("User is not valid");
    }

    for (var i in user) {
      if (!this[i]) this[i] = user[i];
    }

    if (!crypt) return _bluebird2['default'].resolve(this);

    return this.crypt();
  }

  /**
   * getCookie
   * @return object safe user object (remove password,salt)
   */

  _createClass(User, [{
    key: 'getCookie',
    value: function getCookie() {
      return {
        username: this.username,
        home: this.home,
        key: this.key
      };
    }

    /**
     * sanitize a user object according to the schema
     * @param object user
     * @return object sanitized user
     */
  }, {
    key: 'sanitize',
    value: function sanitize(user) {
      for (var i in _userSchemaJs2['default']) {
        if (typeof user[i] === 'undefined' && _userSchemaJs2['default'][i]['default'] !== undefined) {
          user[i] = _userSchemaJs2['default'][i]['default'];
        } else if (_userSchemaJs2['default'][i].type == 'boolean') {
          user[i] = this.valueToIntegerBool(user[i]);
        } else if (_userSchemaJs2['default'][i].type == 'buffer' && user[i].length && typeof user[i] == 'string') {
          user[i] = user[i].split(_os.EOL).filter(function (v) {
            return v.length > 0;
          });
        }
      }

      return user;
    }

    /**
     * Valids a user through the schema
     * @param user
     * @return boolean
     */
  }, {
    key: 'isValid',
    value: function isValid(user) {
      var valid = Object.keys(_userSchemaJs2['default']).filter(function (e) {
        return !user.hasOwnProperty(e) || /:/g.test(user[e]);
      });

      return valid.length == 0;
    }

    /**
     * valueToIntegerBool 
     * transforms :
     *   - '1', 1, true to 1 
     *   - '0', 0, false to 0 
     * @throws TypeError
     * @param mixed v
     * @return integer
     */
  }, {
    key: 'valueToIntegerBool',
    value: function valueToIntegerBool(v) {
      if (typeof v == 'boolean') {
        return v === true ? 1 : 0;
      }

      if (v !== undefined) {
        //json outputs an integer, body outputs a string
        return v = parseInt('' + v) === 1 ? 1 : 0;
      }

      return 0;
    }

    /**
     * Crypt 
     * Hash this.password
     * @return Promise
     */
  }, {
    key: 'crypt',
    value: function crypt() {
      var self = this;
      return bcrypt.hashAsync(this.password, saltLength).then(function (hash) {
        self.password = hash;
        return _bluebird2['default'].resolve(self);
      })['catch'](function (err) {
        console.error(err);
        return _bluebird2['default'].reject('Could not hash password');
      });
    }

    /**
     * Generates the alphanumerical user key
     * @return Promise
     */
  }, {
    key: 'generateKey',
    value: function generateKey() {
      var self = this;

      //using bcrypt to generate a key
      return bcrypt.genSaltAsync(saltLength).then(function (salt) {
        return bcrypt.hashAsync(salt, saltLength);
      }).then(function (hash) {
        var l = hash.length;
        var s = [];
        var i = 0;
        //take only alpha-numeric chars
        while (l-- && i < keyLength) {
          var c = hash.charAt(l);
          if (/[a-z0-9]/i.test(c)) {
            s.push(c);
            i++;
          }
        }

        self.key = s.join('');
        return _bluebird2['default'].resolve(self);
      })['catch'](function (err) {
        console.error(err);
        return _bluebird2['default'].reject('Could not generate key');
      });
    }

    /**
     * Updates the current user with new values
     * @param object user the new user object
     * @param array ignore keys to be ignored
     * @return Promise
     */
  }, {
    key: 'update',
    value: function update(user, ignore) {

      ignore = ignore ? ignore : [];

      for (var i in _userSchemaJs2['default']) {
        if (_userSchemaJs2['default'][i].update === false && ! ~ignore.indexOf(i)) {
          ignore.push(i);
        }
      }

      var crypt = true;

      //we don't want to update password
      if (user.password == '' || typeof user.password == 'undefined') {
        crypt = false;
      }

      user = this.sanitize(user);

      for (var i in user) {
        if (~ignore.indexOf(i) || ! ~Object.keys(_userSchemaJs2['default']).indexOf(i) || typeof user[i] === 'undefined') continue;

        if (i == 'password' && crypt === false) continue;

        if (_userSchemaJs2['default'][i].directory === true && user[i].length) {
          var dir = _path2['default'].resolve(user.home, user[i]);

          if (!fs.existsSync(dir)) {
            _mkdirp2['default'].sync(dir);
          }
        }

        this[i] = user[i];
      }

      //we want to update the key (form boolean checkbox/option)
      if ('' + user.key === '1') {
        return this.generateKey().then(function (u) {
          return crypt ? u.crypt() : _bluebird2['default'].resolve(u);
        });
      }

      return crypt ? this.crypt() : _bluebird2['default'].resolve(this);
    }

    /**
     * Returns the user string for database
     * @return string
     */
  }, {
    key: 'toString',
    value: function toString() {
      var str = [];

      for (var _p in _userSchemaJs2['default']) {
        if (_userSchemaJs2['default'][_p].type == 'buffer') {
          var b = _util2['default'].isArray(this[_p]) ? this[_p].join(_os.EOL) : this[_p];
          str.push(new Buffer(b).toString('base64'));
        } else {
          str.push('' + this[_p]);
        }
      }

      return str.join(':');
    }
  }]);

  return User;
})();

exports.User = User;
exports.Users = Users;