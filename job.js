'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _ipcee = require('ipcee');

var _ipcee2 = _interopRequireDefault(_ipcee);

var ipc = (0, _ipcee2['default'])(process);
var debug = require('debug')('explorer:job');
var p = require('path');

var plugins = {};
var args = [].slice.call(process.argv, 2);

for (var i in args) {
  var title = p.basename(args[i], '.js');
  debug('Require %s', title);
  plugins[title] = require(args[i])(ipc);
}

ipc.on('command', function (args) {
  for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    data[_key - 1] = arguments[_key];
  }

  args = args.split('.');

  var command = args.shift();
  var option = args.shift();

  (0, _assert2['default'])(command, 'Must have a "command" argument');
  (0, _assert2['default'])(option, 'Must have an "option" argument');

  debug('Got command %s.%s with data %o', command, option, data);

  var job = plugins[command];

  if (!job) {
    return ipc.send('error', 'Command ' + command + ' is not available');
  }

  if (option !== undefined && option in job && typeof job[option] == 'function') {
    return job[option].apply(job, data);
  }

  return ipc.send('error', 'Option ' + option + ' is not a valid option');
});

ipc.on('info', function () {
  var plugin = arguments[0] === undefined ? null : arguments[0];

  if (plugin && !(plugin in plugins)) return ipc.send('error', 'Plugin ' + plugin + ' is not available');

  var check = Object.keys(plugins);
  var data = {};

  if (plugin) check = [plugins];

  for (var i in check) {
    data[check[i]] = plugins[check[i]].info();
  }

  return ipc.send('info', data);
});

ipc.on('clear', function (username) {

  var check = Object.keys(plugins);
  var data = {};

  for (var i in check) {
    data[check[i]] = plugins[check[i]].clear(username);
  }

  return ipc.send('clear', data);
});

ipc.on('uncaughtException', function (err) {
  //Temptation would be to send the full Error object
  //but JSON.stringify(new Error('test')) will return '{}'
  ipc.send('error', err.toString(), err.stack);

  console.error(err.stack);

  process.nextTick(function () {
    process.exit(1);
  });
});

ipc.send('job.start', Object.keys(plugins));