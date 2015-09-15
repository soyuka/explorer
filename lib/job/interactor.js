'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ipcee = require('ipcee');

var _ipcee2 = _interopRequireDefault(_ipcee);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var debug = require('debug')('explorer:interactor');
var interactor = undefined;

/**
 * Interactor
 * This is used to run job.js and interact with IPC through EventEmitter
 */
function Interactor() {

  if (!this instanceof Interactor) {
    return new Interactor();
  }

  _events.EventEmitter.call(this);

  this.job = null;
}

_util2['default'].inherits(Interactor, _events.EventEmitter);

/**
 * Run
 * Forks job.js with the plugins
 * Hooks exit, start and error events
 * @param array plugins strings representing a directory in plugin_path
 * @return Promise resolved when job has started
 */
Interactor.prototype.run = function (plugins) {
  var self = this;

  if (this.job) {
    throw new ReferenceError("Job is already running with this interactor");
  }

  debug('Forking job with plugins %o', plugins);

  this.job = (0, _child_process.fork)(_path2['default'].join(__dirname, './container.js'), plugins);

  this.ipc = (0, _ipcee2['default'])(this.job);

  var events = {
    exit: function exit(code) {
      debug('Job exit with code %d', code);
      self.ipc.removeListener('exit', events.exit);
      self.ipc.removeListener('error', events.error);
      self.job = null;
      self.emit('exit', code);
    },
    error: function error(err) {
      console.error('Got error');
      console.error(err);
      self.emit('error', err);
    }
  };

  this.ipc.addListener('exit', events.exit);
  this.ipc.addListener('error', events.error);

  return new _bluebird2['default'](function (resolve, reject) {
    self.ipc.once('job.start', function (plugins) {
      return resolve(plugins);
    });
  });
};

/**
 * Kills the fork
 * @return void
 */
Interactor.prototype.kill = function () {
  this.job.kill();
};

/**
 * Singleton
 */
if (!interactor) interactor = new Interactor();

exports['default'] = interactor;
module.exports = exports['default'];